/**
 * This class contains the backend logic for all custom list view components.
 * @author Ashis Kumar Maharana
 * @since 19/06/2021
 */
public inherited sharing class CustomListViewController {
	/**
	 * Given the api name of an object, returns its schema describe result
	 * @param objectApiName
	 * @return  `Schema.DescribeSObjectResult`
	 */
	private static Schema.DescribeSObjectResult describeSObject(String objectApiName) {
		if (String.isNotBlank(objectApiName)) {
			return getSObjectType(objectApiName)?.getDescribe();
		}
		return null;
	}
	/**
	 * Given the api name of an object, returns its sobjecttype
	 * @param objectApiName
	 * @return  `Schema.SObjectType`
	 */
	private static Schema.SObjectType getSObjectType(String objectApiName) {
		if (String.isNotBlank(objectApiName)) {
			return ((SObject) Type.forName(objectApiName).newInstance())?.getSObjectType();
		}
		return null;
	}
	/**
	 * Generate sobjectfieldinfo from a given schema field describe result
	 * @param fieldDescribe
	 * @return  `SObjectFieldInfo`
	 */
	private static SObjectFieldInfo generateSObjectFieldInfo(
		Schema.DescribeFieldResult fieldDescribe
	) {
		SObjectFieldInfo info = new SObjectFieldInfo();
		info.fieldApiName = fieldDescribe.getName();
		info.fieldLabel = fieldDescribe.getLabel();
		info.fieldType = String.valueOf(fieldDescribe.getType());
		info.isNameField =
			fieldDescribe.getName() == 'Name' ||
			fieldDescribe.getName() == 'DeveloperName' ||
			fieldDescribe.isNameField();
		info.isUpdatable = fieldDescribe.isUpdateable();
		info.isSortable = fieldDescribe.isSortable();
		return info;
	}
	/**
	 * Generate sobjectnameinfo from a given schema sobject describe result
	 * @param sobjectDescribe
	 * @return  `static`
	 */
	private static SObjectNameInfo generateSObjectNameInfo(
		Schema.DescribeSObjectResult sobjectDescribe
	) {
		SObjectNameInfo nameInfo = new SObjectNameInfo();
		nameInfo.label = sobjectDescribe.getLabel();
		nameInfo.labelPlural = sobjectDescribe.getLabelPlural();
		nameInfo.apiName = sobjectDescribe.getName();
		return nameInfo;
	}
	/**
	 * Given the api name of an object, returns its plural label
	 * @param objectApiName
	 * @return  `string`
	 * @exception
	 */
	private static string getObjectLabelPlural(String objectApiName) {
		try {
			return describeSObject(objectApiName)?.getLabelPlural();
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}
	/**
	 * Get all sobjects in the org with their name, api name, plural name
	 * @return  `List<SObjectNameInfo>`
	 * @exception
	 */
	@AuraEnabled(cacheable=true)
	public static List<SObjectNameInfo> getAllSObjectNames() {
		try {
			List<SObjectNameInfo> allSObjectNames = new List<SObjectNameInfo>();
			for (Schema.SObjectType eachSObjectType : Schema.getGlobalDescribe().values()) {
				Schema.DescribeSObjectResult objectInfo = eachSObjectType.getDescribe();
				if (objectInfo.isQueryable() && objectInfo.isAccessible()) {
					allSObjectNames.add(generateSObjectNameInfo(objectInfo));
				}
			}
			allSObjectNames.sort();
			return allSObjectNames;
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}
	/**
	 * Get all fields from the given sobject
	 * @param objectApiName
	 * @return  `List<SObjectFieldInfo>`
	 * @exception
	 */
	@AuraEnabled(cacheable=true)
	public static List<SObjectFieldInfo> getAllFieldNames(String objectApiName) {
		try {
			Schema.DescribeSObjectResult sobjectInfo = describeSObject(objectApiName);
			if (sobjectInfo <> null) {
				List<SObjectFieldInfo> fieldInfos = new List<SObjectFieldInfo>();
				for (Schema.SObjectField field : sobjectInfo.fields.getMap().values()) {
					fieldInfos.add(generateSObjectFieldInfo(field.getDescribe()));
				}
				fieldInfos.sort();
				return fieldInfos;
			}
			return null;
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}
	/**
	 *
	 * @param objectApiName
	 * @return  `ListViewInfo`
	 * @exception
	 */
	private static ListViewInfo getListViewInfoByName(String objectApiName) {
		try {
			ListViewInfo info = new ListViewInfo();
			info.objectLabelPlural = getObjectLabelPlural(objectApiName);
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
	/**
	 *
	 * @param objectApiName
	 * @param fields
	 * @param filters
	 * @return  `List<SObject>`
	 * @exception
	 */
	private static List<SObject> getSObjectRows(
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
	/**
	 *
	 * @param query
	 * @return  `List<SObject>`
	 * @exception
	 */
	@AuraEnabled(cacheable=true)
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
	/**
	 *
	 * @param query
	 * @param rowLimit
	 * @param offset
	 * @return  `List<SObject>`
	 * @exception
	 */
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
	/**
	 *
	 */
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
	/**
	 * This class is searialised to share the sobject name properties
	 */
	public class SObjectNameInfo implements System.Comparable {
		@AuraEnabled
		public String label;
		@AuraEnabled
		public String apiName;
		@AuraEnabled
		public String labelPlural;
		public Integer compareTo(Object compareTo) {
			SObjectNameInfo other = (SObjectNameInfo) compareTo;
			return this.label == other.label ? 0 : this.label > other.label ? 1 : -1;
		}
	}
	/**
	 * This class is searialised to share the field properties
	 */
	public class SObjectFieldInfo implements System.Comparable {
		@AuraEnabled
		public String fieldLabel;
		@AuraEnabled
		public String fieldType;
		@AuraEnabled
		public String fieldApiName;
		@AuraEnabled
		public Boolean isUpdatable;
		@AuraEnabled
		public Boolean isSortable;
		@AuraEnabled
		public Boolean isNameField;
		public Integer compareTo(Object compareTo) {
			SObjectFieldInfo other = (SObjectFieldInfo) compareTo;
			return this.fieldLabel == other.fieldLabel
				? 0
				: this.fieldLabel > other.fieldLabel ? 1 : -1;
		}
	}

	public class SObjectRows {
		@AuraEnabled
		public Boolean hasMore = false;
		@AuraEnabled
		public List<SObject> records = new List<SObject>();
	}
}
