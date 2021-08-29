CREATE TABLE "car_insurance_quote" (
    "id" SERIAL NOT NULL,
    "ageofdriver" INTEGER NOT NULL,
    "monthlypremium" DECIMAL(12,2) NOT NULL,
    "yearlypremium" DECIMAL(12,2) NOT NULL,
    "createdon" TIMESTAMP(6) NOT NULL,

    PRIMARY KEY ("id")
);

CREATE TABLE "car_brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "minimumdriverage" INTEGER NOT NULL,
    "yearlypremium" DECIMAL(12,2) NOT NULL,

    PRIMARY KEY ("id")
);

CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "hashedpassword" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user.username_unique" ON "user"("username");
