import { LightningElement, api } from 'lwc';
import illustration from './illustration.html';
import datatable from './datatable.html';
import getRowsByOffset from '@salesforce/apex/CustomListViewController.getSObjectRowsWithOffset';

export default class CustomDatatable extends LightningElement {
	_rows = [];
	_backupRows = [];
	@api columns = [];
	@api keyField = '';
	@api query = '';
	@api maxRows = 10;
	_searchTerm = '';

	@api
	set rows(value) {
		if (value && value.length > 0) {
			this._rows = value;
		}
	}
	get rows() {
		return this._rows;
	}

	@api
	filter(term) {
		this._searchTerm = term;
		if (term && term !== '') {
			const matcher = new RegExp(term, 'i');
			this._rows = this._backupRows.filter((row) => {
				let matched = false;
				for (const key in row) {
					if (matcher.test(`${row[key]}`)) {
						matched = true;
						break;
					}
				}
				return matched;
			});
		} else {
			this._rows = this._backupRows.length > 0 ? [...this._backupRows] : [...this._rows];
		}
	}

	render() {
		return this.rows.length ? datatable : illustration;
	}

	async handleLoadMore(event) {
		if (this._searchTerm === '' && this.rows.length < this.maxRows) {
			const datatableEl = event.target;
			datatableEl.isLoading = true;
			console.log('loading more rows...');
			const nextRows = await getRowsByOffset({
				query: this.query,
				rowLimit: 15,
				offset: this.rows.length
			});
			console.log(`loaded ${nextRows.length} more rows`);
			this._rows = [
				...this._rows,
				...nextRows.map((row) => {
					return {
						...row,
						recordURL: `/lightning/r/${row.Id}/view`
					};
				})
			];
			this._backupRows = [...this._rows];
			datatableEl.isLoading = false;
		}
	}
}
