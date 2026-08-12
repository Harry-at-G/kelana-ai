def print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style):
    print("=============================")
    print("KelanaAI")
    print("=============================")
    print(f"Destination     : {destination}")
    print(f"Country         : {country}")  
    print(f"Days            : {days}")         
    print(f"Budget          : {budget} {currency}")
    print(f"Currency        : {currency}")
    print(f"Travel Month    : {travel_month}")
    print(f"Style           : {travel_style}")   

# Using Function
print_trip_summary("Japan","Japan",5,1500,"USD","December","Backpacker")
#print_trip_summary("Bali",4,3000,"Family")
