public inherited sharing class CustomListViewController {
	@AuraEnabled(cacheable=true)
	public static string getObjectLabel(String objectApiName) {
		try {
			Schema.DescribeSObjectResult sobjectInfo = ((SObject) Type.forName(objectApiName)
					.newInstance())
				?.getSObjectType()
				?.getDescribe();
			return sobjectInfo?.getLabelPlural();
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	@AuraEnabled(cacheable=true)
	public static ListViewInfo getListViewInfoByName(String objectApiName) {
		try {
			ListViewInfo info = new ListViewInfo();
			info.objectLabelPlural = getObjectLabel(objectApiName);
			info.query = String.escapeSingleQuotes(
				'SELECT Id, Name FROM ' +
				objectApiName +
				' ORDER BY Name'
			);
			info.rows = getSObjectRows(info.query);
			info.totalRows = Database.countQuery('SELECT COUNT() FROM ' + objectApiName);
			info.columns = '[{"label":"Name","fieldName":"recordURL","type":"url","typeAttributes":{"label":{"fieldName":"Name"},"target":"_blank"}}]';
			return info;
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	public static List<SObject> getSObjectRows(
		String objectApiName,
		List<String> fields,
		List<String> filters
	) {
		try {
			return getSObjectRows(
				String.format(
					'SELECT {0}, Id FROM {1} WHERE {2} ORDER BY Name, Id',
					new List<String>{
						String.join(fields, ', '),
						objectApiName,
						String.join(filters, ' AND ')
					}
				)
			);
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	public static List<SObject> getSObjectRows(String query) {
		try {
			if (query == null || String.isBlank(query)) {
				return null;
			}
			return getSObjectRowsWithOffset(query, 15, 0);
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	@AuraEnabled(cacheable=true)
	public static List<SObject> getSObjectRowsWithOffset(
		String query,
		Integer rowLimit,
		Integer offset
	) {
		try {
			return Database.query(
				String.escapeSingleQuotes(query + ' LIMIT :rowLimit OFFSET :offset')
			);
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	public class ListViewInfo {
		@AuraEnabled
		public String query;
		@AuraEnabled
		public Integer totalRows;
		@AuraEnabled
		public String columns;
		@AuraEnabled
		public String keyField;
		@AuraEnabled
		public String objectLabelPlural;
		@AuraEnabled
		public SObject[] rows;
		public ListViewInfo() {
			keyField = 'Id';
		}
	}

	// public class ListViewColumn {
	// 	@AuraEnabled
	// 	public String label;
	// 	@AuraEnabled
	// 	public String fieldName;
	// 	@AuraEnabled
	// 	public String type = 'text';
	// 	@AuraEnabled
	// 	public String typeAttributes;
	// 	@AuraEnabled
	// 	public String cellAttributes;
	// 	@AuraEnabled
	// 	public Boolean editable = false;
	// }
}
