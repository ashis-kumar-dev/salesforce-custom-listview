import { LightningElement, api } from 'lwc';
import illustration from './illustration.html';
import datatable from './datatable.html';

export default class CustomDatatable extends LightningElement {
	@api rows = [];
	@api columns = [];
	@api keyField = '';

	render() {
		return this.rows.length ? datatable : illustration;
	}
}
