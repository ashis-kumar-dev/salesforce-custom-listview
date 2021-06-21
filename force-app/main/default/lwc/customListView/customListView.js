import { LightningElement, wire } from 'lwc';
import getListViewInfo from '@salesforce/apex/CustomListViewController.getListViewInfoByName';
import getSObjectRows from '@salesforce/apex/CustomListViewController.getSObjectRows';

export default class CustomListView extends LightningElement {
	iconName = 'standard:user';
	objectApiName = 'User';
	objectLabel = 'Users';
	error = '';
	columns = [];
	keyField = '';
	query = '';
	totalRows = 0;
	rows = [];
	objectApiNameEditMode = false;
	isLoading = false;
	isFilterOpen = false;
	now = Date.now();
	searchTerm = '';

	get listViewName() {
		return `All ${this.objectLabel}`;
	}

	// @wire(getListViewInfo, { objectApiName: '$objectApiName' })
	// parseListViewInfo(response) {
	// 	console.log(response);
	// 	if (response.data) {
	// 		this.error = undefined;
	// 		this.columns = JSON.parse(response.data.columns);
	// 		this.keyField = response.data.keyField;
	// 		this.objectLabel = response.data.objectLabelPlural;
	// 		this.query = response.data.query;
	// 		this.totalRows = response.data.totalRows;
	// 		this.rows = response.data.rows.map((row) => {
	// 			return {
	// 				...row,
	// 				recordURL: `/lightning/r/${row.Id}/view`
	// 			};
	// 		});
	// 	} else if (response.error) {
	// 		this.error = JSON.stringify(response.error?.body.message);
	// 		this.columns = undefined;
	// 		this.keyField = undefined;
	// 		this.objectLabel = undefined;
	// 		this.query = undefined;
	// 		this.totalRows = 0;
	// 		this.rows = [];
	// 	}
	// 	this.isLoading = false;
	// }

	handleObjectApiNameChange() {
		// let newObjectApiName;
		// switch (event.target.name) {
		// 	case 'edit-object-api-name':
		// 		this.objectApiNameEditMode = true;
		// 		break;
		// 	case 'set-object-api-name':
		// 		newObjectApiName = this.template.querySelector(
		// 			'input[name="object-api-name-input"]'
		// 		).value;
		// 		this.isLoading = newObjectApiName !== this.objectApiName;
		// 		this.objectApiName = newObjectApiName;
		// 		this.objectApiNameEditMode = false;
		// 		break;
		// 	default:
		// 		break;
		// }
		this.template.querySelector('c-modal').show();
	}

	handleFilterClick() {
		this.isFilterOpen = !this.isFilterOpen;
	}

	handleListViewControlsSelection(event) {
		console.log(`${event.detail.value} selected`);
	}

	handleSearchKeyChange(event) {
		this.searchTerm = event.detail.value;
	}

	handleSearch() {
		const datatable = this.template.querySelector('c-custom-datatable');
		datatable.filter(this.searchTerm);
	}

	async handleSave(event) {
		const { labelPlural, objectApiName, fields } = event.detail;
		this.objectApiName = objectApiName;
		this.objectLabel = labelPlural;
		this.columns = fields.map((field) => {
			return {
				label: field.fieldLabel,
				fieldName: field.fieldApiName,
				type: this.getDatatableColumnType(field.fieldType),
				editable: field.isUpdatable,
				sortable: field.isSortable
			};
		});
		this.template.querySelector('c-modal').hide();
		this.isLoading = true;
		try {
			this.query = `SELECT ${fields.map((field) => field.fieldApiName).join(',')} FROM ${
				this.objectApiName
			} ORDER BY ${fields.find((field) => field.isNameField).fieldApiName}, Id`;
			console.log(this.query);
			this.rows = await getSObjectRows({
				query: this.query
			});
		} catch (error) {
			console.error(error);
		}
		this.isLoading = false;
	}

	handleCancel() {
		this.template.querySelector('c-modal').hide();
	}

	generateColumnInfo(fieldApiName, fieldType) {
		if (fieldType === 'REFERENCE') {
			return {
				label: { fieldName: this.generateParentNamePath(fieldApiName) },
				target: '_blank'
			};
		}
		return {};
	}

	generateParentNamePath(fieldApiName) {
		return `${fieldApiName}`.endsWith('__c')
			? `${fieldApiName}`.replace('__c', '__r.Name')
			: `${fieldApiName}`.endsWith('ID')
			? `${fieldApiName}`.replace('Id', '.Name')
			: '';
	}

	getDatatableColumnType(fieldType) {
		let datatableColumnType;
		switch (fieldType) {
			case 'DATE':
				datatableColumnType = 'date';
				break;
			case 'DATETIME':
				datatableColumnType = 'date-local';
				break;
			case 'BOOLEAN':
				datatableColumnType = 'boolean';
				break;
			case 'DECIMAL':
				datatableColumnType = 'number';
				break;
			case 'DOUBLE':
				datatableColumnType = 'number';
				break;
			case 'URL':
				datatableColumnType = 'url';
				break;
			case 'REFERENCE':
				datatableColumnType = 'url';
				break;
			case 'CURRENCY':
				datatableColumnType = 'currency';
				break;
			case 'PHONE':
				datatableColumnType = 'phone';
				break;
			default:
				datatableColumnType = 'text';
				break;
		}
		return datatableColumnType;
	}
}
