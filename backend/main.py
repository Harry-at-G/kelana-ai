from services.trip_service import calculate_daily_budget, get_trip_category, get_travel_season

# Function for printing the output
def print_trip_summary(destination, country, days, budget, currency, travel_month, total_cost, travel_style):
    print("=============================")
    print("KelanaAI")
    print("=============================")
    print(f"Destination     : {destination}")
    print(f"Country         : {country}")
    print(f"Days            : {days}")         
    print(f"Budget          : {budget} {currency}")
    print(f"Currency        : {currency}")
    print(f"Month of Travel : {travel_month}")
    print(f"Total Cost      : {total_cost} {currency}")
    print(f"Style           : {travel_style}")   

# Ask the user for trip details
destination = input ("Destination : ")
country = input ("Country : ")
days        = int(input("Days : "))
budget      = float(input("Budget : "))
currency    = input("Currency : ")
hotel_cost  = float(input("Hotel Cost : "))
food_cost   = float(input("Food Cost : "))
trans_cost  = float(input("Transport Cost : "))
misc_cost   = float(input("Misc. Cost : "))
travel_month= input("Travel Month : ")
travel_style= input("Travel Style : ")

# Calculate Costs and Compare to Budget
total_cost = hotel_cost + food_cost + trans_cost + misc_cost
if total_cost > budget:
    print("⚠ Budget exceeded.")

# Using Function to print the output
print_trip_summary(destination,country,days,budget,currency, travel_month, total_cost,travel_style)

# Translate business rules into code
if budget < 1000:
    category = "Backpacker"
elif budget <= 3000:
    category = "Standard"
else:
    category = "Luxury"
print(f"Category        : {category}")
    
# Arithmetic operators: + - * / //
daily_budget = budget/days
print(f"Daily Budget    : {daily_budget} {currency}/day")

# A list holds multiple values
recommended_places = [
    "Tokyo Tower",
    "Shibuya",
    "Mount Fuji"
]

# Loop through the list
print("Recommended Places:")
for place in recommended_places:
    print(f" - {place}")

daily = calculate_daily_budget(budget,days)
category = get_trip_category(budget)
print(f"{category} - {daily} {currency}/day")

if category == "Backpacker":
    recommended_transportation = "Bus"
elif category == "Standard":
    recommended_transportation = "Train"
else: 
    recommended_transportation = "Flight"

print(f"Recommended Transportation: {recommended_transportation}")
season = get_travel_season(travel_month)
print(f"Season          : {season}")
