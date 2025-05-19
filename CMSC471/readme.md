# Invisible Aftershocks: COVID-19’s Mental Toll Across America

COVID-19 was a global pandemic that affected billions of people across the world. It led to the closure of schools, parks, restaurants, and many other public places for years. Only a small percentage of jobs—those deemed critical to the functioning of society—were allowed to continue, while others were forced to adapt or shut down entirely.

Since its spread to the United States in 2019, COVID-19 has claimed the lives of over a million people. The virus has impacted everyone in one way or another—whether through the loss of loved ones, jobs, or other hardships that are difficult to fully quantify.
One such hardship is the effect the pandemic had on the mental health of the American people. Unfortunately, mental health concerns were often pushed aside, as more immediate issues like death rates and unemployment took center stage. While some may not view mental health as essential, society is made up of individuals, and when individuals have poor mental health, the larger population inevitably feels the consequences.

This project is a deep dive into this issue and explores how COVID-19 has affected the mental health of the U.S. population.

## What it is

Our project is an interactive visualization that displays depression rates in a sliding-dot animation. The graph shows how depression rates change from year to year. Furthermore, our graph allows users to specifiy a number of demographic markers, such as age and income, to quantify the positive or negative mental health outcomes from those specific groups.

## Data

This visualization relies on the [National Survey on Drug Use and Health](https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/datafiles), which is directed by the Substance Abuse and Mental health Services Administration, which is part of the U.S. Department of Health and Human Services. We collected the 2018-2023 datasets, which contain millions of data entries, and parsed out data that we thought would impact mental health.

From these datasets, we use the variables:

ADDPREV, or SEVERAL DAYS OR LNGR WHEN FELT SAD/EMPTY/DPRSD
* This variable was mapped to Depression

CATAGE, or RC-AGE CATEGORY
* This variable was mapped to Age Range

NEWRACE2, or RC-RACE/HISPANICITY RECODE (7 LEVELS)
* This variable was mapped to Ethnicity

HEALTH, or "Would you say your health in general is excellent, very good, good, fair, or poor"
* This variable was mapped to Bodily health

INCOME
* This variable was mapped to income range

IRSEX 
* This variable was mapped to sex

ANYHLTI2, or covered by health insurance
* This variable was mapped to Health Insurance

SERVICE, or have you served in the military?
* This variable was mapped to Military Service

All of the data in the datasets were weighted. Our project keeps these weights in mind when computing depression outcome rates.

## Running the Project
This project is built using JS, CSS, and HTML.
1. Download the github repository
2. Open the project in visual studio code
3. Run the project using VSCode Live Server

To recreate the datasets, you can use the `dataformatter.py` script.
1. Download python version 3.13
2. install Pandas via pip
3. Download all NSDUH datasets from years you want as tsv files
4. Ensure all datasets are named with the format `NSDUH_20XX_Tab.txt`
5. Run the python script

## Contributors
Aleko
- Created project base
- Made circles move
- Added group selector
- Linked group data to circles
- Bugfixes

Yuji
- Combined and cleaned data from 2018-2023 NSDUH datasets
- Implemented data group filtering
- Implemented weighted-percent tabulation
- Bugfixes
- What it is, Data, and Running section of writeup

Luul
- Overview, What it is, and Data section of writeup