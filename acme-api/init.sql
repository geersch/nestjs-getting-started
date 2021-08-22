CREATE TABLE IF NOT EXISTS car_insurance_quote (
   id serial PRIMARY KEY,
   ageOfDriver INT NOT NULL,
   monthlyPremium decimal(12,2) NOT NULL,
   yearlyPremium decimal(12,2) NOT NULL,
   createdOn TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS car_brand (
   id serial PRIMARY KEY,
   name text NOT NULL,
   minimumDriverAge INT NOT NULL,
   yearlyPremium decimal(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "user" (
   id serial PRIMARY KEY,
   username text NOT NULL UNIQUE,
   hashedpassword text NOT NULL
);
