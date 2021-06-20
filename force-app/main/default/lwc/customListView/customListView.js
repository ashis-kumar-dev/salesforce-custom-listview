import { LightningElement, wire } from 'lwc';
import getListViewInfo from '@salesforce/apex/CustomListViewController.getListViewInfoByName';

export default class CustomListView extends LightningElement {
	iconName = 'standard:avatar';
	objectApiName = 'Profile';
	objectLabel = '';
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

	@wire(getListViewInfo, { objectApiName: '$objectApiName' })
	parseListViewInfo(response) {
		console.log(response);
		if (response.data) {
			this.error = undefined;
			this.columns = JSON.parse(response.data.columns);
			this.keyField = response.data.keyField;
			this.objectLabel = response.data.objectLabelPlural;
			this.query = response.data.query;
			this.totalRows = response.data.totalRows;
			this.rows = response.data.rows.map((row) => {
				return {
					...row,
					recordURL: `/lightning/r/${row.Id}/view`
				};
			});
		} else if (response.error) {
			this.error = JSON.stringify(response.error?.body.message);
			this.columns = undefined;
			this.keyField = undefined;
			this.objectLabel = undefined;
			this.query = undefined;
			this.totalRows = 0;
			this.rows = [];
		}
		this.isLoading = false;
	}

	handleObjectApiNameChange(event) {
		let newObjectApiName;
		switch (event.target.name) {
			case 'edit-object-api-name':
				this.objectApiNameEditMode = true;
				break;
			case 'set-object-api-name':
				newObjectApiName = this.template.querySelector(
					'input[name="object-api-name-input"]'
				).value;
				this.isLoading = newObjectApiName !== this.objectApiName;
				this.objectApiName = newObjectApiName;
				this.objectApiNameEditMode = false;
				break;
			default:
				break;
		}
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
}
