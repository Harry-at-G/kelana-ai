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
travel_style= input("Travel Stryle : ")

# Calculate Costs and Compare to Budget
total_cost = hotel_cost + food_cost + trans_cost + misc_cost
if total_cost > budget:
    print("⚠ Budget exceeded.")

# Using Function to print the output
print_trip_summary(destination,country,days,budget,currency, travel_month, total_cost,travel_style)
