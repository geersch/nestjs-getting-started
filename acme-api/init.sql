CREATE TABLE IF NOT EXISTS car_insurance_quote (
   id serial PRIMARY KEY,
   ageOfDriver INT NOT NULL,
   monthlyPremium decimal(12,2) NOT NULL,
   yearlyPremium decimal(12,2) NOT NULL,
   createdOn TIMESTAMP NOT NULL
);
