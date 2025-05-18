import pandas as pd

COL_MAP = {
    'ADDPREV': 'Depression',
    'CATAGE': 'Age',
    'NEWRACE2': 'Race',
    'HEALTH': 'Health',
    'INCOME': 'Income',
    'IRSEX': 'Sex',
    'ANYHLTI2': 'Health Insurance',
    'SERVICE': 'Military Service',
    'FILEDATE': 'Date',
    'ANALWT_C': 'Weight',
}

LABEL_MAP = {
    'ADDPREV': {
        1: 'Yes',
        2: 'No',
        85: 'Skip/Other',
        94: 'Skip/Other',
        97: 'Skip/Other',
        98: 'Skip/Other',
        99: 'Skip/Other'
    },
    'CATAGE': {
        1: '12-17',
        2: '18-25',
        3: '26-34',
        4: '35+'
    },
    'NEWRACE2': {
        1: 'White',
        2: 'Black',
        3: 'Native American',
        4: 'Native HI / Pacific Islander',
        5: 'Asian',
        6: 'Multiracial',
        7: 'Hispanic'
    },
    'HEALTH': {
        1: 'Excellent',
        2: 'Very Good',
        3: 'Good',
        4: 'Fair',
        5: 'Poor',
        94: 'Dont Know/Refused',
        97: 'Dont Know/Refused'
    },
    'INCOME': {
        1: '<$20,000',
        2: '$20,000 - $49,000',
        3: '$50,000 - $74,999',
        4: '$75,000+'
    },
    'IRSEX': {
        1: 'Male',
        2: 'Female'
    },
    'ANYHLTI2': {
        1: 'Yes',
        2: 'No',
        94: 'Other/DK/Refused',
        97: 'Other/DK/Refused',
        98: 'Other/DK/Refused'
    },
    'SERVICE': {
        1: 'Yes',
        2: 'No',
        85: 'Other/Dk/Refused',
        89: 'Other/Dk/Refused',
        97: 'Other/Dk/Refused',
        98: 'Other/Dk/Refused',
        99: 'No'
    },
    'SEXIDENT22': {
        1: 'Straight',
        2: 'Gay / Lesbian',
        3: 'Bisexual',
        4: 'Other LGBT Identifier',
        5: 'Unsure',
        6: 'Don\'t understand question',
        85: 'Other/DK/Refused',
        94: 'Other/DK/Refused',
        97: 'Other/DK/Refused',
        98: 'Other/DK/Refused'
    }
}

YEAR = 2018

def tab_weighted_percent(df: pd.DataFrame, var: str, weight: str) -> float:
    weighted_count = df.groupby(var, observed=False)[weight].sum()
    return weighted_count / weighted_count.sum() * 100


def format(year: int = YEAR, col_mapper: dict = COL_MAP):
    
    if year == 2020:
        col_mapper = col_mapper.copy()
        col_mapper.pop('ANALWT_C')
        col_mapper['ANALWTQ1Q4_C'] = 'Weight'
    
    if year >= 2021:
        col_mapper = col_mapper.copy()
        col_mapper.pop('ANALWT_C')
        col_mapper['ANALWT2_C'] = 'Weight'
    
    df = pd.read_csv(f'data/NSDUH_{year}_Tab.txt', sep='\t', header=0, usecols=col_mapper.keys())
    
    df.replace(LABEL_MAP, inplace=True)
    df.rename(columns=col_mapper, inplace=True)

    df = df[(df['Depression'] != 'Skip/Other')]

    print(df)

    df.to_csv(f'{year}.csv', index=False, columns=col_mapper.values())





    
def combine(csvs: list = ['2018.csv', '2019.csv', '2020.csv', '2021.csv', '2022.csv', '2023.csv'], exp = 'data.csv'):
    
    outdata = ''
    
    first = True
    
    for csv in csvs:
        with open(csv) as f:
            if not first:
                outdata = f'{outdata}{'\n'.join(f.read().splitlines()[1:])}'
            else:
                first=False
                outdata = f'{outdata}{f.read()}'
    
    with open(exp, 'w') as f:
        f.write(outdata)



for i in range(2018, 2024):
    format(i)

combine()