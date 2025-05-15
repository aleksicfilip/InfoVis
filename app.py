from flask import Flask, render_template, jsonify
import pandas as pd
import json
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import numpy as np


app = Flask(__name__)

# List of countries to filter
COUNTRIES = ['Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia', 
            'Australia', 'Austria', 'Azerbaijan', 'Brazil', 'Bulgaria', 'Cameroon', 
            'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus', 
            'Czech Republic', 'Ecuador', 'Egypt, Arab Rep.', 'Eritrea', 'Ethiopia', 
            'France', 'Germany', 'Ghana', 'Greece', 'India', 'Indonesia', 
            'Iran, Islamic Rep.', 'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan', 
            'Kazakhstan', 'Kenya', 'Lebanon', 'Malta', 'Mexico', 'Morocco', 
            'Pakistan', 'Peru', 'Philippines', 'Russian Federation', 
            'Syrian Arab Republic', 'Tunisia', 'Turkey', 'Ukraine']


def prepare_pca_data(df):
    # Filter for year 2020
    df_2020 = df[df['year'] == 2020].copy()
    
    # Get numeric columns (excluding 'year' and 'country_name')
    numeric_columns = df_2020.select_dtypes(include=[np.number]).columns
    numeric_columns = [col for col in numeric_columns if col != 'year']
    
    # Create feature matrix
    X = df_2020[numeric_columns]
    
    # Handle missing values
    X = X.fillna(X.mean())
    
    # Standardize the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Apply PCA
    pca = PCA(n_components=2)
    pca_result = pca.fit_transform(X_scaled)
    
    # Create PCA result dictionary
    pca_dict = {}
    for idx, country in enumerate(df_2020['country_name']):
        pca_dict[country] = {
            'x': float(pca_result[idx, 0]),
            'y': float(pca_result[idx, 1])
        }
    
    return pca_dict
@app.route("/")
def index():
    df = pd.read_csv("static/data/cleaned_filtered_agriRuralDevelopment.csv")
    
    # Get list of all numeric indicators (columns)
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    indicators = [col for col in numeric_columns if col != 'year']
    
    # Filter countries and prepare main data
    filtered_df = df[df["country_name"].isin(COUNTRIES)]
    
    # Prepare data structure
    data_structure = {
        'indicators': indicators,  # List of available indicators
        'current_data': {},       # 2020 data for map coloring
        'time_series': {},        # Complete time series for line chart
        'pca_data': prepare_pca_data(filtered_df)  # PCA coordinates
    }
    
    # Populate current_data (2020)
    df_2020 = filtered_df[filtered_df['year'] == 2020]
    for country in COUNTRIES:
        country_data = df_2020[df_2020['country_name'] == country]
        if not country_data.empty:
            data_structure['current_data'][country] = {
                indicator: float(country_data[indicator].iloc[0])
                for indicator in indicators
                if not pd.isna(country_data[indicator].iloc[0])
            }
    
    # Populate time_series
    for country in COUNTRIES:
        country_data = filtered_df[filtered_df['country_name'] == country]
        data_structure['time_series'][country] = {
            year: {
                indicator: float(value)
                for indicator in indicators
                if not pd.isna(value := row[indicator])
            }
            for year, row in country_data.iterrows()
        }
    
    return render_template("index.html", data=json.dumps(data_structure))


@app.route("/pca")
def get_pca():
    df = pd.read_csv("static/data/cleaned_filtered_agriRuralDevelopment.csv")
    filtered_df = df[df["country_name"].isin(COUNTRIES)]
    pca_data = prepare_pca_data(filtered_df)
    return jsonify(pca_data)

if __name__ == '__main__':
    app.run(debug=True)