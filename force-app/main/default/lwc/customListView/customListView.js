import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import getListViewInfo from '@salesforce/apex/CustomListViewController.getListViewInfoByName';
import getSObjectRows from '@salesforce/apex/CustomListViewController.getSObjectRows';
import getRowsByOffset from '@salesforce/apex/CustomListViewController.getSObjectRowsWithOffset';

export default class CustomListView extends LightningElement {
	iconName = 'standard:user';
	objectApiName = 'User';
	objectLabel = 'Users';
	// Datatabel inputs
	columns = [];
	keyField = 'Id';
	rows = [];
	// Loading state and others
	isLoading = true;
	isFilterOpen = false;
	now = Date.now();
	// Query inputs
	query = 'SELECT Name FROM User ORDER BY Name';
	fieldsToQuery = [];
	urlColumns = [];
	hasMoreRows = true;
	_rowLimit = 15;
	// Object selector modal
	showObjectSelector = false;

	get listViewName() {
		return `All ${this.objectLabel}`;
	}

	get rowsCount() {
		return this.rows?.length || 0;
	}

	connectedCallback() {
		this.columns.push(
			this.generateColumnInfo({
				fieldApiName: 'Name',
				fieldLabel: 'Name',
				fieldType: 'String',
				isNameField: true,
				isSortable: true
			})
		);
	}

	@wire(getSObjectRows, { query: '$query' })
	wiredGetRows({ data, error }) {
		if (data) {
			this.prepareDatatableRows(data).then((rows) => {
				this.rows = rows;
				this.isLoading = false;
			});
		} else if (error) {
			console.error(JSON.stringify(error));
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Something went wrong!',
					message: error?.body?.message || JSON.stringify(error),
					variant: 'error'
				})
			);
			this.isLoading = false;
		} else {
			this.isLoading = true;
		}
	}

	prepareDatatableRows(sobjectRows) {
		this.hasMoreRows = !(sobjectRows.length < this._rowLimit);
		// this.isLoading = true;
		return Promise.resolve(
			sobjectRows.map((sobjectRow) => {
				const row = {
					...sobjectRow
				};
				this.urlColumns.forEach((col) => {
					if (row[col]) {
						row[this.generateURLName(col)] = `/${row[col === 'Name' ? 'Id' : col]}`;
						const path = `${this.generateParentNamePath(col)}`;
						// console.log(path);
						const [parent, name] = path.split('.');
						if (parent && name) row[path.replace('.', '')] = row[parent][name];
					}
				});
				// console.table(row);
				return row;
			})
		);
		// this.isLoading = false;
	}

	handleObjectApiNameChange() {
		this.showObjectSelector = true;
	}

	handleFilterClick() {
		this.isFilterOpen = !this.isFilterOpen;
	}

	handleListViewControlsSelection(event) {
		switch (event.detail.value) {
			case 'select-fields':
				this.showObjectSelector = true;
				break;

			default:
				console.log(`${event.detail.value} selected`);
				break;
		}
	}

	async handleSearchKeyChange(event) {
		const searchTerm = event.detail.value;
		const searchBox = event.target;
		searchBox.isLoading = true;
		const datatable = this.template.querySelector('c-custom-datatable');
		const filtered = await this.filterRowsBySearchTerm([...this.rows], searchTerm);
		datatable.rows = filtered;
		searchBox.isLoading = false;
	}

	filterRowsBySearchTerm(rows, term) {
		if (term && term !== '') {
			const matcher = new RegExp(term, 'i');
			return Promise.resolve(
				rows.filter((row) => {
					let matched = false;
					for (const key in row) {
						if (matcher.test(`${row[key]}`)) {
							matched = true;
							break;
						}
					}
					return matched;
				})
			);
		}
		return Promise.resolve(rows);
	}

	async handleSave(event) {
		// clear stored data
		this.fieldsToQuery = [];
		this.urlColumns = [];
		// console.table(event.detail);
		const { labelPlural, objectApiName, fields } = event.detail;
		this.objectApiName = objectApiName;
		this.objectLabel = labelPlural;
		this.columns = fields.map((field) => this.generateColumnInfo(field));
		this.showObjectSelector = false;
		this.query = `SELECT ${this.fieldsToQuery.join(',')} FROM ${this.objectApiName}	ORDER BY ${
			fields.find((field) => field.isNameField).fieldApiName
		}, Id`;
		console.log(this.query);
		this.isLoading = true;
		this.rows = [];
	}

	handleCancel() {
		this.showObjectSelector = false;
	}

	addFieldToQueryList(field) {
		const found = this.fieldsToQuery.find((item) => item === field);
		if (!found) {
			this.fieldsToQuery.push(field);
		}
	}

	generateColumnInfo(fieldInfo) {
		// this.fieldsToQuery.push(fieldInfo.fieldApiName);
		this.addFieldToQueryList(fieldInfo.fieldApiName);
		const column = {
			label: fieldInfo.fieldLabel,
			fieldName: fieldInfo.fieldApiName,
			type: this.getDatatableColumnType(fieldInfo.fieldType),
			// editable: fieldInfo.isUpdatable,
			sortable: fieldInfo.isSortable
		};
		if (fieldInfo.isNameField || fieldInfo.fieldType === 'REFERENCE') {
			column.type = 'url';
			column.fieldName = this.generateURLName(fieldInfo.fieldApiName);
			column.typeAttributes = this.generateTypeAttribute(
				fieldInfo.fieldApiName,
				fieldInfo.fieldType
			);
		}
		return column;
	}

	generateTypeAttribute(fieldApiName) {
		return {
			label: { fieldName: this.generateParentNamePath(fieldApiName).replace('.', '') },
			target: '_blank'
		};
	}

	generateParentNamePath(fieldApiName) {
		const parentNamePath = `${fieldApiName}`.endsWith('__c')
			? `${fieldApiName}`.replace('__c', '__r.Name')
			: `${fieldApiName}`.endsWith('Id')
			? `${fieldApiName}`.replace('Id', '.Name')
			: fieldApiName;
		if (fieldApiName !== 'Id' && parentNamePath !== fieldApiName) {
			this.addFieldToQueryList(parentNamePath);
		}
		return parentNamePath;
	}

	generateURLName(fieldApiName) {
		const found = this.urlColumns.find((item) => item === fieldApiName);
		if (!found) {
			this.urlColumns.push(fieldApiName);
		}
		return `${fieldApiName}`.endsWith('__c')
			? `${fieldApiName}`.replace('__c', '__Url')
			: `${fieldApiName}`.endsWith('Id')
			? `${fieldApiName}`.replace('Id', '__Url')
			: `${fieldApiName}__Url`;
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
			case 'EMAIL':
				datatableColumnType = 'email';
				break;
			default:
				datatableColumnType = 'text';
				break;
		}
		return datatableColumnType;
	}

	async handleQueryMore() {
		try {
			const records = await getRowsByOffset({
				query: this.query,
				rowLimit: this._rowLimit,
				offset: this.rows.length
			});
			this.prepareDatatableRows(records).then((rows) => {
				this.rows = [...this.rows].concat(rows);
			});
		} catch (error) {
			console.error(error);
		}
	}
}
