export interface Airport {
  code: string;
  city: string;
  country: string;
  name: string;
}

export const AIRPORTS: Airport[] = [
  // Maldives
  { code: 'MLE', city: 'Male', country: 'Maldives', name: 'Velana International Airport' },
  
  // India
  { code: 'DEL', city: 'Delhi', country: 'India', name: 'Indira Gandhi International Airport' },
  { code: 'BOM', city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji International Airport' },
  { code: 'BLR', city: 'Bangalore', country: 'India', name: 'Kempegowda International Airport' },
  { code: 'MAA', city: 'Chennai', country: 'India', name: 'Chennai International Airport' },
  { code: 'CCU', city: 'Kolkata', country: 'India', name: 'Netaji Subhas Chandra Bose International Airport' },
  { code: 'HYD', city: 'Hyderabad', country: 'India', name: 'Rajiv Gandhi International Airport' },
  { code: 'COK', city: 'Kochi', country: 'India', name: 'Cochin International Airport' },
  { code: 'AMD', city: 'Ahmedabad', country: 'India', name: 'Sardar Vallabhbhai Patel International Airport' },
  { code: 'PNQ', city: 'Pune', country: 'India', name: 'Pune Airport' },
  { code: 'GOI', city: 'Goa', country: 'India', name: 'Goa International Airport' },
  { code: 'TRV', city: 'Thiruvananthapuram', country: 'India', name: 'Trivandrum International Airport' },
  { code: 'JAI', city: 'Jaipur', country: 'India', name: 'Jaipur International Airport' },
  { code: 'LKO', city: 'Lucknow', country: 'India', name: 'Chaudhary Charan Singh International Airport' },
  { code: 'GAU', city: 'Guwahati', country: 'India', name: 'Lokpriya Gopinath Bordoloi International Airport' },
  
  // UAE
  { code: 'DXB', city: 'Dubai', country: 'UAE', name: 'Dubai International Airport' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE', name: 'Abu Dhabi International Airport' },
  { code: 'SHJ', city: 'Sharjah', country: 'UAE', name: 'Sharjah International Airport' },
  { code: 'DWC', city: 'Dubai', country: 'UAE', name: 'Al Maktoum International Airport' },
  
  // Saudi Arabia
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', name: 'King Abdulaziz International Airport' },
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', name: 'King Khalid International Airport' },
  { code: 'DMM', city: 'Dammam', country: 'Saudi Arabia', name: 'King Fahd International Airport' },
  { code: 'MED', city: 'Medina', country: 'Saudi Arabia', name: 'Prince Mohammad bin Abdulaziz International Airport' },
  
  // Qatar
  { code: 'DOH', city: 'Doha', country: 'Qatar', name: 'Hamad International Airport' },
  
  // Kuwait
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait', name: 'Kuwait International Airport' },
  
  // Bahrain
  { code: 'BAH', city: 'Manama', country: 'Bahrain', name: 'Bahrain International Airport' },
  
  // Oman
  { code: 'MCT', city: 'Muscat', country: 'Oman', name: 'Muscat International Airport' },
  
  // Sri Lanka
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', name: 'Bandaranaike International Airport' },
  
  // Bangladesh
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', name: 'Hazrat Shahjalal International Airport' },
  { code: 'CGP', city: 'Chittagong', country: 'Bangladesh', name: 'Chittagong International Airport' },
  
  // Pakistan
  { code: 'KHI', city: 'Karachi', country: 'Pakistan', name: 'Jinnah International Airport' },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan', name: 'Allama Iqbal International Airport' },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan', name: 'Islamabad International Airport' },
  
  // Nepal
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal', name: 'Tribhuvan International Airport' },
  
  // Thailand
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport' },
  { code: 'DMK', city: 'Bangkok', country: 'Thailand', name: 'Don Mueang International Airport' },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', name: 'Phuket International Airport' },
  
  // Singapore
  { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Changi Airport' },
  
  // Malaysia
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur International Airport' },
  
  // Indonesia
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', name: 'Soekarno-Hatta International Airport' },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', name: 'Ngurah Rai International Airport' },
  
  // Philippines
  { code: 'MNL', city: 'Manila', country: 'Philippines', name: 'Ninoy Aquino International Airport' },
  { code: 'CEB', city: 'Cebu', country: 'Philippines', name: 'Mactan-Cebu International Airport' },
  
  // Vietnam
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', name: 'Tan Son Nhat International Airport' },
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam', name: 'Noi Bai International Airport' },
  
  // China
  { code: 'PEK', city: 'Beijing', country: 'China', name: 'Beijing Capital International Airport' },
  { code: 'PVG', city: 'Shanghai', country: 'China', name: 'Shanghai Pudong International Airport' },
  { code: 'CAN', city: 'Guangzhou', country: 'China', name: 'Guangzhou Baiyun International Airport' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', name: 'Hong Kong International Airport' },
  
  // Japan
  { code: 'NRT', city: 'Tokyo', country: 'Japan', name: 'Narita International Airport' },
  { code: 'HND', city: 'Tokyo', country: 'Japan', name: 'Haneda Airport' },
  { code: 'KIX', city: 'Osaka', country: 'Japan', name: 'Kansai International Airport' },
  
  // South Korea
  { code: 'ICN', city: 'Seoul', country: 'South Korea', name: 'Incheon International Airport' },
  
  // United Kingdom
  { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'Heathrow Airport' },
  { code: 'LGW', city: 'London', country: 'United Kingdom', name: 'Gatwick Airport' },
  { code: 'STN', city: 'London', country: 'United Kingdom', name: 'Stansted Airport' },
  { code: 'MAN', city: 'Manchester', country: 'United Kingdom', name: 'Manchester Airport' },
  
  // France
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport' },
  { code: 'ORY', city: 'Paris', country: 'France', name: 'Orly Airport' },
  
  // Germany
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport' },
  { code: 'MUC', city: 'Munich', country: 'Germany', name: 'Munich Airport' },
  
  // Netherlands
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', name: 'Amsterdam Schiphol Airport' },
  
  // Italy
  { code: 'FCO', city: 'Rome', country: 'Italy', name: 'Fiumicino Airport' },
  { code: 'MXP', city: 'Milan', country: 'Italy', name: 'Malpensa Airport' },
  
  // Spain
  { code: 'MAD', city: 'Madrid', country: 'Spain', name: 'Adolfo Suárez Madrid-Barajas Airport' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', name: 'Barcelona-El Prat Airport' },
  
  // Turkey
  { code: 'IST', city: 'Istanbul', country: 'Turkey', name: 'Istanbul Airport' },
  { code: 'SAW', city: 'Istanbul', country: 'Turkey', name: 'Sabiha Gökçen International Airport' },
  
  // Egypt
  { code: 'CAI', city: 'Cairo', country: 'Egypt', name: 'Cairo International Airport' },
  
  // South Africa
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', name: 'O.R. Tambo International Airport' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', name: 'Cape Town International Airport' },
  
  // Kenya
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', name: 'Jomo Kenyatta International Airport' },
  
  // Nigeria
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', name: 'Murtala Muhammed International Airport' },
  
  // Ethiopia
  { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia', name: 'Addis Ababa Bole International Airport' },
  
  // United States
  { code: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy International Airport' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States', name: 'Los Angeles International Airport' },
  { code: 'ORD', city: 'Chicago', country: 'United States', name: 'O\'Hare International Airport' },
  { code: 'ATL', city: 'Atlanta', country: 'United States', name: 'Hartsfield-Jackson Atlanta International Airport' },
  { code: 'SFO', city: 'San Francisco', country: 'United States', name: 'San Francisco International Airport' },
  { code: 'MIA', city: 'Miami', country: 'United States', name: 'Miami International Airport' },
  { code: 'DFW', city: 'Dallas', country: 'United States', name: 'Dallas/Fort Worth International Airport' },
  { code: 'DEN', city: 'Denver', country: 'United States', name: 'Denver International Airport' },
  { code: 'SEA', city: 'Seattle', country: 'United States', name: 'Seattle-Tacoma International Airport' },
  { code: 'BOS', city: 'Boston', country: 'United States', name: 'Logan International Airport' },
  { code: 'PHX', city: 'Phoenix', country: 'United States', name: 'Phoenix Sky Harbor International Airport' },
  { code: 'IAH', city: 'Houston', country: 'United States', name: 'George Bush Intercontinental Airport' },
  { code: 'LAS', city: 'Las Vegas', country: 'United States', name: 'Harry Reid International Airport' },
  { code: 'EWR', city: 'Newark', country: 'United States', name: 'Newark Liberty International Airport' },
  { code: 'DTW', city: 'Detroit', country: 'United States', name: 'Detroit Metropolitan Wayne County Airport' },
  { code: 'MSP', city: 'Minneapolis', country: 'United States', name: 'Minneapolis-Saint Paul International Airport' },
  { code: 'PHL', city: 'Philadelphia', country: 'United States', name: 'Philadelphia International Airport' },
  
  // Canada
  { code: 'YYZ', city: 'Toronto', country: 'Canada', name: 'Toronto Pearson International Airport' },
  { code: 'YVR', city: 'Vancouver', country: 'Canada', name: 'Vancouver International Airport' },
  { code: 'YUL', city: 'Montreal', country: 'Canada', name: 'Montréal-Pierre Elliott Trudeau International Airport' },
  { code: 'YYC', city: 'Calgary', country: 'Canada', name: 'Calgary International Airport' },
  
  // Australia
  { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Sydney Kingsford Smith Airport' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', name: 'Melbourne Airport' },
  { code: 'BNE', city: 'Brisbane', country: 'Australia', name: 'Brisbane Airport' },
  { code: 'PER', city: 'Perth', country: 'Australia', name: 'Perth Airport' },
  
  // New Zealand
  { code: 'AKL', city: 'Auckland', country: 'New Zealand', name: 'Auckland Airport' },
  
  // Brazil
  { code: 'GRU', city: 'São Paulo', country: 'Brazil', name: 'São Paulo/Guarulhos International Airport' },
  { code: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', name: 'Rio de Janeiro/Galeão International Airport' },
  
  // Argentina
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', name: 'Ministro Pistarini International Airport' },
  
  // Mexico
  { code: 'MEX', city: 'Mexico City', country: 'Mexico', name: 'Mexico City International Airport' },
  { code: 'CUN', city: 'Cancún', country: 'Mexico', name: 'Cancún International Airport' },
  
  // Colombia
  { code: 'BOG', city: 'Bogotá', country: 'Colombia', name: 'El Dorado International Airport' },
  
  // Chile
  { code: 'SCL', city: 'Santiago', country: 'Chile', name: 'Arturo Merino Benítez International Airport' },
  
  // Peru
  { code: 'LIM', city: 'Lima', country: 'Peru', name: 'Jorge Chávez International Airport' },
  
  // Russia
  { code: 'SVO', city: 'Moscow', country: 'Russia', name: 'Sheremetyevo International Airport' },
  { code: 'DME', city: 'Moscow', country: 'Russia', name: 'Domodedovo International Airport' },
  
  // Myanmar
  { code: 'RGN', city: 'Yangon', country: 'Myanmar', name: 'Yangon International Airport' },
  
  // Afghanistan
  { code: 'KBL', city: 'Kabul', country: 'Afghanistan', name: 'Hamid Karzai International Airport' },
  
  // Iran
  { code: 'IKA', city: 'Tehran', country: 'Iran', name: 'Imam Khomeini International Airport' },
  
  // Iraq
  { code: 'BGW', city: 'Baghdad', country: 'Iraq', name: 'Baghdad International Airport' },
  
  // Jordan
  { code: 'AMM', city: 'Amman', country: 'Jordan', name: 'Queen Alia International Airport' },
  
  // Lebanon
  { code: 'BEY', city: 'Beirut', country: 'Lebanon', name: 'Beirut-Rafic Hariri International Airport' },
  
  // Morocco
  { code: 'CMN', city: 'Casablanca', country: 'Morocco', name: 'Mohammed V International Airport' },
  
  // Tunisia
  { code: 'TUN', city: 'Tunis', country: 'Tunisia', name: 'Tunis-Carthage International Airport' },
  
  // Algeria
  { code: 'ALG', city: 'Algiers', country: 'Algeria', name: 'Houari Boumediene Airport' },
  
  // Libya
  { code: 'TIP', city: 'Tripoli', country: 'Libya', name: 'Tripoli International Airport' },
  
  // Sudan
  { code: 'KRT', city: 'Khartoum', country: 'Sudan', name: 'Khartoum International Airport' },
  
  // Yemen
  { code: 'SAH', city: 'Sana\'a', country: 'Yemen', name: 'Sana\'a International Airport' },
  
  // Syria
  { code: 'DAM', city: 'Damascus', country: 'Syria', name: 'Damascus International Airport' },
];

export const searchAirports = (query: string): Airport[] => {
  if (!query || query.length < 2) return [];
  const lowerQuery = query.toLowerCase();
  return AIRPORTS.filter(airport => 
    airport.city.toLowerCase().includes(lowerQuery) ||
    airport.code.toLowerCase().includes(lowerQuery) ||
    airport.country.toLowerCase().includes(lowerQuery) ||
    airport.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
};
