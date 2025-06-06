import argparse
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re


def read_input(path):
    if path.lower().endswith('.csv'):
        return pd.read_csv(path)
    return pd.read_excel(path)


def search_online_prices(part_number, manufacturer):
    query = f"{manufacturer} {part_number} price"
    url = f"https://duckduckgo.com/html/?q={requests.utils.quote(query)}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception:
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    results = []
    for snippet in soup.select('.result__snippet'):
        text = snippet.get_text()
        match = re.search(r"(\d+[,.]\d+)\s?[€$]", text)
        if match:
            price = float(match.group(1).replace(',', '.'))
            results.append(("unknown", price))
    return results


def compare_prices(row):
    part_number = row.get('Herstellerteilenummer') or row.get('PartNumber')
    manufacturer = row.get('Hersteller') or row.get('Manufacturer')
    our_price = row.get('Verkaufspreis') or row.get('OurPrice')

    prices = search_online_prices(part_number, manufacturer)
    comparison = {
        'part_number': part_number,
        'manufacturer': manufacturer,
        'our_price': our_price,
        'prices_found': prices,
    }
    if prices and our_price is not None:
        best_price = min(p[1] for p in prices)
        comparison['difference'] = our_price - best_price
    return comparison


def main():
    parser = argparse.ArgumentParser(description='Benachmark Preisvergleich')
    parser.add_argument('file', help='Pfad zur CSV oder Excel Datei')
    args = parser.parse_args()

    df = read_input(args.file)
    for _, row in df.iterrows():
        info = compare_prices(row)
        print(f"\nPreisvergleich für {info['manufacturer']} {info['part_number']}:")
        if info['prices_found']:
            for source, price in info['prices_found']:
                print(f"  {source}: {price:.2f} EUR")
        else:
            print('  Keine Preise gefunden')
        if info.get('our_price') is not None:
            print(f"Unser Preis: {info['our_price']} EUR")
        if info.get('difference') is not None:
            print(f"Differenz zum günstigsten Angebot: {info['difference']:.2f} EUR")


if __name__ == '__main__':
    main()
