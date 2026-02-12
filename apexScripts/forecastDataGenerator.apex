List<AppGridAg__AG_Forecast__c> forecasts = new List<AppGridAg__AG_Forecast__c>();

// Define a base sales goal
Decimal baseSalesGoal = 2000000;

// Define sales goal for each product category
Map<String, Decimal> productCategoryTargets = new Map<String, Decimal>{
  'Products' => 2000000,
  'Services' => 3000000
};
List<String> regions = new List<String>{
  'North America',
  'South America',
  'Europe',
  'Asia'
};
List<String> periods = new List<String>{ 'Q1', 'Q2', 'Q3', 'Q4' };

List<String> salesChannel = new List<String>{ 'Direct Sales', 'Partner Sales' };

List<User> users = [
  SELECT Id, Name
  FROM User
  WHERE
    (NOT Name LIKE '%process%')
    AND (NOT Name LIKE '%data%')
    AND (NOT Name LIKE '%integration%')
    AND (NOT Name LIKE '%Security%')
    AND (NOT Name LIKE '%Chatter%')
];

for (User user : users) {
  // ramdonly select a sales salesChannel - returns 0 or 1
  Integer randomNumber = Math.floor(Math.random() * (1 - 0 + 1) + 0).intValue();
  String channel = salesChannel[randomNumber];

  // Randomly select a region
  Integer randomRegionIndex = Math.floor(Math.random() * (regions.size() - 1))
    .intValue();
  String region = regions[randomRegionIndex];

  for (String productCategory : productCategoryTargets.keySet()) {
    // vary the sales goal for each user for each product category
    Decimal categorySalesGoal = productCategoryTargets.get(productCategory);

    // vary the sales goal for each user for each product category by +- 25%
    Decimal adjustmentFactor = (Math.random() * 0.5) - 0.25;
    Decimal adjustedCategorySalesGoal =
      categorySalesGoal * (1 + adjustmentFactor);

    Decimal forecastedAmount = categorySalesGoal * 0.8; // 80% of goal as forecasted amount
    for (String period : periods) {
      // Create forecast record
      AppGridAg__AG_Forecast__c forecast = new AppGridAg__AG_Forecast__c(
        AppGridAg__Region__c = region,
        AppGridAg__User__c = user.Id,
        AppGridAg__Forecast_Period__c = period,
        AppGridAg__Forecast_Year__c = 2024,
        AppGridAg__Forecast_Amount__c = adjustedCategorySalesGoal,
        AppGridAg__Sales_Channel__c = channel
      );
      forecasts.add(forecast);
    }
  }
}

// Insert all sample data
try {
  insert forecasts;
  System.debug('Forecast data created: ' + forecasts.size() + ' records.');
} catch (DmlException e) {
  System.debug('Error creating forecast data: ' + e.getMessage());
}
