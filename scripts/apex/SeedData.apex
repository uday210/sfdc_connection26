/**
 * SeedData.apex
 * Run via: sf apex run --file scripts/apex/SeedData.apex -o <your-org-alias>
 *
 * Creates 5 demo Accounts with realistic details and 6 Projects across varied
 * statuses, all linked to their parent Account. Run once after deploying Project__c.
 *
 * Safe to re-run — existing records with the same names will be updated, not duplicated.
 */

// ─── Accounts ────────────────────────────────────────────────────────────────

List<Account> accounts = new List<Account>{
    new Account(
        Name                = 'Northwind Traders',
        Industry            = 'Retail',
        Type                = 'Customer - Direct',
        Phone               = '+1-312-555-0100',
        Website             = 'https://www.northwindtraders.com',
        AnnualRevenue       = 85000000,
        NumberOfEmployees   = 1200,
        BillingStreet       = '233 N Michigan Ave',
        BillingCity         = 'Chicago',
        BillingState        = 'IL',
        BillingPostalCode   = '60601',
        BillingCountry      = 'US',
        Description         = 'Regional retail chain focused on specialty foods and household goods. Long-term customer since 2018. Strategic account for Midwest territory.'
    ),
    new Account(
        Name                = 'Acme Corporation',
        Industry            = 'Manufacturing',
        Type                = 'Customer - Direct',
        Phone               = '+1-313-555-0200',
        Website             = 'https://www.acmecorp.com',
        AnnualRevenue       = 220000000,
        NumberOfEmployees   = 3500,
        BillingStreet       = '1400 Woodward Ave',
        BillingCity         = 'Detroit',
        BillingState        = 'MI',
        BillingPostalCode   = '48226',
        BillingCountry      = 'US',
        Description         = 'Enterprise manufacturing customer. Primary buyer of industrial automation software. Multi-year ERP and IoT rollout in progress.'
    ),
    new Account(
        Name                = 'Globex Technologies',
        Industry            = 'Technology',
        Type                = 'Customer - Channel',
        Phone               = '+1-415-555-0300',
        Website             = 'https://www.globextech.io',
        AnnualRevenue       = 450000000,
        NumberOfEmployees   = 2800,
        BillingStreet       = '101 Market St',
        BillingCity         = 'San Francisco',
        BillingState        = 'CA',
        BillingPostalCode   = '94105',
        BillingCountry      = 'US',
        Description         = 'High-growth SaaS company undergoing digital transformation. Channel partner for resale division. Strategic priority account for West Coast team.'
    ),
    new Account(
        Name                = 'Contoso Financial Services',
        Industry            = 'Finance',
        Type                = 'Customer - Direct',
        Phone               = '+1-212-555-0400',
        Website             = 'https://www.contosofinancial.com',
        AnnualRevenue       = 1200000000,
        NumberOfEmployees   = 8000,
        BillingStreet       = '388 Greenwich St',
        BillingCity         = 'New York',
        BillingState        = 'NY',
        BillingPostalCode   = '10013',
        BillingCountry      = 'US',
        Description         = 'Large financial services firm with complex compliance requirements. Data analytics platform initiative stalled due to executive sponsor change and budget freeze.'
    ),
    new Account(
        Name                = 'Fabrikam Healthcare',
        Industry            = 'Healthcare',
        Type                = 'Prospect',
        Phone               = '+1-617-555-0500',
        Website             = 'https://www.fabrikamhealth.org',
        AnnualRevenue       = 320000000,
        NumberOfEmployees   = 4200,
        BillingStreet       = '25 Shattuck St',
        BillingCity         = 'Boston',
        BillingState        = 'MA',
        BillingPostalCode   = '02115',
        BillingCountry      = 'US',
        Description         = 'Regional healthcare network evaluating CRM integration. HIPAA compliance sign-off required before data migration can proceed. High-value new logo opportunity.'
    )
};

// Match existing accounts by Name, update if found, insert if new
Map<String, Account> existingAccounts = new Map<String, Account>();
for (Account a : [SELECT Id, Name FROM Account WHERE Name IN ('Northwind Traders','Acme Corporation','Globex Technologies','Contoso Financial Services','Fabrikam Healthcare')]) {
    existingAccounts.put(a.Name, a);
}
List<Account> toInsertAccounts = new List<Account>();
List<Account> toUpdateAccounts = new List<Account>();
for (Account a : accounts) {
    if (existingAccounts.containsKey(a.Name)) {
        a.Id = existingAccounts.get(a.Name).Id;
        toUpdateAccounts.add(a);
    } else {
        toInsertAccounts.add(a);
    }
}
if (!toInsertAccounts.isEmpty()) insert toInsertAccounts;
if (!toUpdateAccounts.isEmpty()) update toUpdateAccounts;

// Refresh with IDs
Map<String, Id> accountIds = new Map<String, Id>();
for (Account a : [SELECT Id, Name FROM Account WHERE Name IN ('Northwind Traders','Acme Corporation','Globex Technologies','Contoso Financial Services','Fabrikam Healthcare')]) {
    accountIds.put(a.Name, a.Id);
}

System.debug('Accounts seeded: ' + accountIds.keySet());

// ─── Projects ─────────────────────────────────────────────────────────────────
// Using dynamic SObject creation to avoid compile-time field resolution errors
// that can occur when fields were deployed in the same session.

Schema.SObjectType projectType = Schema.getGlobalDescribe().get('Project__c');

List<SObject> projects = new List<SObject>();

SObject p1 = projectType.newSObject();
p1.put('Name',            'Northwind Cloud Migration');
p1.put('Account__c',      accountIds.get('Northwind Traders'));
p1.put('Status__c',       'In Progress');
p1.put('Start_Date__c',   Date.newInstance(2026, 2, 1));
p1.put('End_Date__c',     Date.newInstance(2026, 6, 15));
p1.put('Description__c',  'Migrating on-premise retail POS and inventory systems to Salesforce Commerce Cloud and AWS. Phase 1 covers 14 flagship stores. Phase 2 (franchise rollout) planned for Q3.');
p1.put('Risks__c',        'EU data center scope expansion may delay delivery — legal review of GDPR data residency requirements still pending.');
projects.add(p1);

SObject p2 = projectType.newSObject();
p2.put('Name',            'Acme ERP Rollout');
p2.put('Account__c',      accountIds.get('Acme Corporation'));
p2.put('Status__c',       'Implementation');
p2.put('Start_Date__c',   Date.newInstance(2026, 1, 15));
p2.put('End_Date__c',     Date.newInstance(2026, 7, 30));
p2.put('Description__c',  'Full SAP S/4HANA implementation across manufacturing plants in Detroit and Toledo. UAT completed for modules 1-3. Go-live for modules 4-5 scheduled for June.');
p2.put('Risks__c',        '');
projects.add(p2);

SObject p3 = projectType.newSObject();
p3.put('Name',            'Globex Digital Transformation');
p3.put('Account__c',      accountIds.get('Globex Technologies'));
p3.put('Status__c',       'Planning');
p3.put('Start_Date__c',   Date.newInstance(2026, 6, 1));
p3.put('End_Date__c',     Date.newInstance(2026, 12, 31));
p3.put('Description__c',  'Modernizing Globex internal tooling: Salesforce Sales Cloud, Slack, and Tableau as the unified revenue intelligence stack. Executive sponsor confirmed. Kickoff scheduled for June 1.');
p3.put('Risks__c',        '');
projects.add(p3);

SObject p4 = projectType.newSObject();
p4.put('Name',            'Contoso Analytics Platform');
p4.put('Account__c',      accountIds.get('Contoso Financial Services'));
p4.put('Status__c',       'At Risk');
p4.put('Start_Date__c',   Date.newInstance(2025, 11, 1));
p4.put('End_Date__c',     Date.newInstance(2026, 4, 30));
p4.put('Description__c',  'Enterprise data lake and analytics layer on Snowflake + Tableau, replacing legacy BI stack. Phase 1 delivered on time. Phase 2 blocked by budget freeze and unresolved executive sponsor.');
p4.put('Risks__c',        'Budget freeze impacting Phase 2 deliverables. Executive sponsor change pending board approval. Project end date likely to slip by 6-8 weeks.');
projects.add(p4);

SObject p5 = projectType.newSObject();
p5.put('Name',            'Fabrikam CRM Integration');
p5.put('Account__c',      accountIds.get('Fabrikam Healthcare'));
p5.put('Status__c',       'On Hold');
p5.put('Start_Date__c',   Date.newInstance(2026, 3, 1));
p5.put('End_Date__c',     Date.newInstance(2026, 9, 30));
p5.put('Description__c',  'Integrating Fabrikam patient management system with Salesforce Health Cloud. Data mapping complete. Awaiting HIPAA BAA countersignature and legal clearance for PHI data transfer.');
p5.put('Risks__c',        'Awaiting HIPAA compliance sign-off before data migration can proceed. Legal review estimated 6-8 weeks. Project on hold until cleared.');
projects.add(p5);

SObject p6 = projectType.newSObject();
p6.put('Name',            'Northwind Phase 2 Expansion');
p6.put('Account__c',      accountIds.get('Northwind Traders'));
p6.put('Status__c',       'Planning');
p6.put('Start_Date__c',   Date.newInstance(2026, 7, 1));
p6.put('End_Date__c',     Date.newInstance(2026, 12, 31));
p6.put('Description__c',  'Franchise rollout of Commerce Cloud to 85 independently-owned Northwind franchise locations following Phase 1 success. Includes franchise-specific analytics dashboard and order management.');
p6.put('Risks__c',        '');
projects.add(p6);

// Delete existing demo projects and re-insert (Name is not an External ID on custom objects)
List<SObject> staleProjects = Database.query(
    'SELECT Id FROM Project__c WHERE Name IN (' +
    '\'Northwind Cloud Migration\',\'Acme ERP Rollout\',\'Globex Digital Transformation\',' +
    '\'Contoso Analytics Platform\',\'Fabrikam CRM Integration\',\'Northwind Phase 2 Expansion\')'
);
if (!staleProjects.isEmpty()) delete staleProjects;
insert projects;

// ─── Sample Tasks (last activities) ──────────────────────────────────────────

Map<String, Id> projectIds = new Map<String, Id>();
for (SObject p : Database.query(
    'SELECT Id, Name FROM Project__c WHERE Name IN (' +
    '\'Northwind Cloud Migration\',\'Acme ERP Rollout\',\'Contoso Analytics Platform\',\'Fabrikam CRM Integration\')'
)) {
    projectIds.put((String)p.get('Name'), (Id)p.get('Id'));
}

List<Task> tasks = new List<Task>{
    new Task(
        Subject      = 'Status call with Priya — GDPR scope discussed',
        Description  = 'Confirmed EU data center requirement. Legal team engaged. Updated risk log.',
        WhatId       = projectIds.get('Northwind Cloud Migration'),
        Status       = 'Completed',
        ActivityDate = Date.today().addDays(-1),
        Priority     = 'Normal'
    ),
    new Task(
        Subject      = 'UAT sign-off — modules 1-3',
        Description  = 'All three modules passed UAT. Go-live for module 4 confirmed for June 10.',
        WhatId       = projectIds.get('Acme ERP Rollout'),
        Status       = 'Completed',
        ActivityDate = Date.today().addDays(-3),
        Priority     = 'Normal'
    ),
    new Task(
        Subject      = 'Escalation call — budget freeze update',
        Description  = 'CFO confirmed Phase 2 budget under review. Board decision expected mid-May.',
        WhatId       = projectIds.get('Contoso Analytics Platform'),
        Status       = 'Completed',
        ActivityDate = Date.today().addDays(-2),
        Priority     = 'High'
    ),
    new Task(
        Subject      = 'Legal follow-up — HIPAA BAA status',
        Description  = 'Sent follow-up to Fabrikam legal team. Awaiting countersignature.',
        WhatId       = projectIds.get('Fabrikam CRM Integration'),
        Status       = 'Completed',
        ActivityDate = Date.today().addDays(-5),
        Priority     = 'Normal'
    )
};

insert tasks;

System.debug('Seed complete. Accounts: ' + accountIds.size() + ', Projects: ' + projects.size() + ', Tasks: ' + tasks.size());
System.debug('Run "sf apex run --file scripts/apex/SeedData.apex" again safely — upserts by Name.');
