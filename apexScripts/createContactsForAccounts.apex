// Anonymous Apex code to create Contacts for all Accounts

// Fetch all accounts
List<Account> accounts = [SELECT Id, Website FROM Account];

// List of possible Titles
List<String> titles = new List<String>{
    'CEO', 'CFO', 'CMO', 'President', 'VP Finance', 'VP Sales', 
    'VP Engineering', 'VP Marketing', 'VP Customer Service', 
    'Director of Sales', 'Director of Marketing', 'Director of Engineering', 
    'Director of Customer Service', 'Developer', 'Architect', 
    'Project Manager', 'Account Manager', 'Systems Engineer', 'Sales Engineer'
};

// List of contact names
List<String> contactNames = new List<String>{
    'Kelvin Parker', 'James Smith', 'Teresa Williams', 'Maria Garcia', 'Karen Chambers', 'Olivia Lopez', 'Maxwell Silva', 
    'Zion Sampson', 'Linda Gallowam', 'Benjamin Newman', 'Daniel Williams', 'Donna Williams', 'Stuart Russell',
    'Harrison Merritt', 'Barbara Fox', 'Linda Giger', 'Linda Rauh', 'Martha Walker', 'Davidson Williams',
    'Reese Mann', 'Deborah Smith', 'Katherine Williams', 'Lillianna Johnson', 'Natalie Williams', 'Cynthia Garcia',
    'Kevin Hartman', 'Claire Williams', 'Louise Williams', 'Lily Williams', 'Nathan Williams', 'Joan Williams',
    'Makaila Stuart', 'Zoey Orr', 'Tina Garcia', 'Lorena Williams', 'Lorena Garcia', 'Lizbeth Williams', 
    'Lacey Boyle', 'Cecilia Williams', 'Joanne Williams', 'Jocelyn Rauh', 'Jocelyn Garcia', 'Doris Garcia',
    'Malakai Simon', 'Eunice Stewart', 'Celia Garcia', 'Shari Apted', 'Shawn Stewart', 'Shirley Williams', 'Sophie Williams',
    'Kaylyn Cisneros', 'Akira Cuevas', 'Amber Williams', 'Andrea Williams', 'Ashley Williams', 'Allison Williams', 'Alexis Williams',
    'Glenn Potts', 'Gloria Gallo', 'Greta Smith', 'Hanna Smith', 'Heather Jones', 'Heather Jones', 'Heather Jones', 'Heather Jones', 'Hannah Smith',
    'Giada Huffman', 'Gillian Mcdonald', 'Lailh Miller', 'Lilianna Ochoa', 'Zaniyah Mcgee', 'Patrick Williamson',
    'Jerry Goodman', 'Warren Velez', 'Victoria Barrett', 'Yurem Poole', 'Beau Adams', 'Kayley Gregory', 'Alissa Sanford',
    'Meadow Solis', 'Adalyn Mercer', 'Arjun Holloway', 'Lindsey Barron', 'Monica Huber', 'Milagros Lee', 'Jabari Warner',
    'Josiah Eaton', 'Jaiden Ramos', 'Rebecca Townsend', 'Gilbert Payne', 'Kaden Barr', 'Carly Blanchard', 'Jaylon Ortega',
    'Mallory Schaefer', 'Aaron Townsend', 'Scarlett Cantrell', 'Aalyah Braun', 'Kaitlyn Murphy', 'Clara Campbell',
    'Braiden Bennett', 'Kennedy Strong', 'Amare Fox', 'Angeline Marks', 'Yasmin Kaufman', 'Haylee Mason', 'Keely Rocha',
    'Adan Doyle', 'Emilio Patel', 'Destiney Estrada', 'Zion Cummings', 'Ellie Wheeler', 'Genevieve Mercer', 'Isabelle Christian',
    'Noah Kerr', 'Jesse Richmond', 'Tyshawn Simon', 'Javion Ball', 'Phoenix Garrison', 'Kamen Obrien', 'Maverick Larson',
    'Scott Proctor', 'Maximillian Crawford', 'Braydon Mcdonald', 'Chloe Knapp', 'Alina Gill', 'Jazlene Weaver', 'Dexter Hunter',
    'Cullen Arellano', 'Noel Wang', 'Will Garrett', 'Yusuf Hernandez', 'Maurice Silva', 'River Sexton', 'Rylan Bradley',
    'Carl Ruiz', 'Conor Gentry', 'Norah Alvarado', 'Douglas Marshall', 'Collin Knight', 'Graham Espinoza', 'Matthias Jordan',
    'Donte Mccormick', 'Everett Mccann', 'Kendrick Cooley', 'Davian Fleming', 'Marisa Gordon', 'Kennedi Fowler',
    'Meadow Washington', 'Patricia Wyatt', 'Justus Rivas', 'Parker Lam', 'Everett Salinas', 'Zackery Mcclure', 'Jaylynn Walker',
    'Jacob Fritz', 'Darius Ellison', 'Lindsay Rollins', 'Elena Vang', 'Molly Bean', 'Raina Melton', 'Laci Arellano',
    'Cayden Little', 'Mckinley Mccann', 'Jaylen Nielsen', 'Jaime Macias', 'Addison Bender', 'Reilly Travis', 'Clinton Sutton',
    'Gracie Molina', 'Van Nelson', 'Maleah Crane', 'Felicity Cooper', 'Eddie Fowler', 'Kendall Roman', 'Joyce Nielsen',
    'Liliana Lowe', 'Johan Mann', 'Kyleigh Guerra', 'Edward Porter', 'Makhi Frost', 'Jadyn Warren', 'Jameson Drake',
    'Kelly Kennedy', 'Karson Blackburn', 'Hugh Orr', 'Jamie Holland', 'Penelope Chandler', 'Kaeden Mann', 'Kylie Gould',
    'Jayvon Jarvis', 'Brooklynn Buck', 'Savanna Hanson', 'Diana Russell', 'Ulises Garrett', 'Julie Gallegos', 'Yesenia Walter',
    'Marlie Padilla', 'Elias Tyler', 'Reina Juarez', 'Teagan Frye', 'Jovany Trevino', 'Nicole Haas', 'Alyssa Stafford',
    'Addison Walters', 'Denise Baker', 'Elise Schneider', 'Zion Combs', 'Diana Friedman', 'Carson Edwards', 'Katelynn Acevedo',
    'Madilynn Fry', 'Ashley Mcmillan', 'Belinda Parks', 'Easton Strickland', 'Averie Powell', 'Karla Pena', 'Teagan Garrison',
    'Clarissa Brandt', 'Amir Christensen', 'Madalyn Gilmore', 'Julia Hunt', 'America Baker', 'Johnny Valentine', 'Yazmin Hanna',
    'Angeline Huber', 'Jay Villarreal', 'Slade Castaneda', 'Cael Downs', 'Karma Lutz', 'Aliya Nixon', 'Elaine Reeves', 'Maci Olson',
    'Steven Vasquez', 'Heaven Adkins', 'Rodney Meza', 'Ella Parker', 'Brycen Walsh', 'Elyse Hays', 'Arturo Stephens',
    'Jasiah Higgins', 'Terry Pruitt', 'Izayah Moran', 'Jackson Huang', 'Vincent Sanford', 'Roy Stone', 'Sergio Wall', 'Trevin Long',
    'Izabelle Walker', 'Greta Koch', 'Landen Herrera', 'Jayvon Zuniga', 'Reid Rojas', 'Shane Herrera', 'Ryker Klein', 'Myah Mejia',
    'Thomas Macias', 'Jeffery Quinn', 'Elianna Knight', 'Jeramiah Hartman', 'Jovany Hensley', 'Heidi Warren', 'Colton Valdez',
    'Abbie Romero', 'Damari Montgomery', 'Jakob Vincent', 'Marcel Novak', 'Kaeden Richardson', 'Wyatt Murphy', 'Deegan Willis',
    'Avah Haley', 'Selina Archer', 'Deangelo Frey', 'Chanel Hale', 'Ayana Velez', 'Raquel Blevins', 'Mallory Fry', 'Giovanna Kaiser',
    'Silas Bryant', 'Rebecca Oneill', 'Odin Barr', 'Nora Navarro', 'Dixie Brewer', 'Ramon Gillespie', 'Faith Olsen', 'Justice Navarro',
    'Elsa Moyer', 'Sidney Fischer', 'Alexus Newman', 'Memphis Braun', 'Mylie Lynn', 'Jax Suarez', 'Semaj Fox', 'Marlene Cross',
    'Rory Webster', 'Darren Browning', 'Keagan Barber', 'Emerson Stark', 'Henry Jones', 'Andreas Watts', 'Natalee Bradley',
    'Molly Decker', 'Armani Fritz', 'Mira Warren', 'Amiya Lewis', 'Baron West', 'Giana Kelley', 'Giovanni Bass', 'Matthew Delacruz',
    'Elijah Foley', 'Liana Logan', 'Myles Marks'
};

// Create lists for FirstNames and LastNames
List<String> firstNames = new List<String>();
List<String> lastNames = new List<String>();

// Populate the firstNames and lastNames lists
for (String fullName : contactNames) {
    List<String> nameParts = fullName.split(' ');
    firstNames.add(nameParts[0]);  // Add first name
    lastNames.add(nameParts[1]);   // Add last name
}

// List to hold contacts to be inserted
List<Contact> contactsToInsert = new List<Contact>();

// Iterate through each account to create contacts
for (Account acc : accounts) {
    // Extract domain from the Account's Website (if available)
    String emailDomain;
    if (acc.Website != null && acc.Website.contains('.')) {
        // Extract domain by removing protocol (http:// or https://)
        emailDomain = acc.Website.replace('http://', '').replace('https://', '').split('/')[0];
    } else {
        // Default domain if Website is null or invalid
        emailDomain = 'example.com';
    }

    // Randomly determine the number of contacts to create (4 to 8)
    Integer numContacts = Math.mod(Math.abs(Crypto.getRandomInteger()), 5) + 4; // Random number between 4 and 8

    for (Integer i = 0; i < numContacts; i++) {
        Contact contact = new Contact();
        
        // Randomly select FirstName and LastName
        contact.FirstName = firstNames[Math.mod(Math.abs(Crypto.getRandomInteger()), firstNames.size())];
        contact.LastName = lastNames[Math.mod(Math.abs(Crypto.getRandomInteger()), lastNames.size())];

        // Randomly assign a Title
        contact.Title = titles[Math.mod(Math.abs(Crypto.getRandomInteger()), titles.size())];

        // Set Email address with the domain derived from the Account Website
        contact.Email = 
            contact.FirstName.toLowerCase() + '.' + contact.LastName.toLowerCase() + '@' + emailDomain;

        contact.AccountId = acc.Id; // Associate with the current account
        contactsToInsert.add(contact);
    }
}

// Insert contacts
if (contactsToInsert.size() > 0) {
    insert contactsToInsert;
}
