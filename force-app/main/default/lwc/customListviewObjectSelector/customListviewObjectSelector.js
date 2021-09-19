import { api, LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllObjects from '@salesforce/apex/CustomListViewController.getAllSObjectNames';
import getAllFields from '@salesforce/apex/CustomListViewController.getAllFieldNames';

export default class CustomListviewObjectSelector extends LightningElement {
	@track sobjectOptions = [];
	@track fieldOptions = [];
	requiredFieldOptions = [];
	_sobjects = new Map();
	_fields = new Map();
	_selectedSobject = '';
	_selectedFields = [];
	loadingSObjects = true;
	loadingFields = true;

	get objectApiName() {
		return this._selectedSobject;
	}
	@api set objectApiName(value) {
		this._selectedSobject = value;
	}

	get fields() {
		return this._selectedFields;
	}
	@api set fields(value) {
		this._selectedFields = value;
	}

	get selectedFields() {
		return this._selectedFields;
	}
	@api set selectedFields(value) {
		this._selectedFields = value;
	}

	@wire(getAllObjects)
	parseSObjects({ data, error }) {
		if (data) {
			this._sobjects.clear();
			// sobjects.forEach((sobject) => this._sobjects.set(`${sobject.apiName}`, sobject));
			this.sobjectOptions = data.map((item) => {
				this._sobjects.set(`${item.apiName}`, item);
				return {
					label: `${item.label} (${item.apiName})`,
					value: `${item.apiName}`
				};
			});
			this.loadingSObjects = false;
		} else if (error) {
			this.loadingSObjects = false;
			console.error(JSON.stringify(error));
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Something went wrong!',
					message: error.body.message,
					variant: 'error'
				})
			);
		} else {
			this.loadingSObjects = true;
		}
	}

	// async handleSobjectSelectionFocused(event) {
	// 	const combobox = event.target;
	// 	try {
	// 		combobox.spinnerActive = true;
	// 		const sobjects = await getAllObjects();
	// 		this._sobjects.clear();
	// 		// sobjects.forEach((sobject) => this._sobjects.set(`${sobject.apiName}`, sobject));
	// 		this.sobjectOptions = sobjects.map((item) => {
	// 			this._sobjects.set(`${item.apiName}`, item);
	// 			return {
	// 				label: `${item.label} (${item.apiName})`,
	// 				value: `${item.apiName}`
	// 			};
	// 		});
	// 		combobox.spinnerActive = false;
	// 	} catch (error) {
	// 		console.error(JSON.stringify(error));
	// 		this.dispatchEvent(
	// 			new ShowToastEvent({
	// 				title: 'Something went wrong!',
	// 				message: error.body.message,
	// 				variant: 'error'
	// 			})
	// 		);
	// 	}
	// }

	@wire(getAllFields, { objectApiName: '$_selectedSobject' })
	parseFields({ data, error }) {
		if (data) {
			this.generateFieldOptions(data);
			this.loadingFields = false;
		} else if (error) {
			this.loadingFields = false;
			console.error(JSON.stringify(error));
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Something went wrong!',
					message: error.body.message,
					variant: 'error'
				})
			);
		} else {
			this.loadingFields = true;
		}
	}

	generateFieldOptions(fields) {
		const dualListBox = this.template.querySelector('lightning-dual-listbox');
		if (dualListBox) dualListBox.showActivityIndicator = true;
		const requiredOptions = [];
		this._fields.clear();
		// fields.forEach((field) => this._fields.set(field.fieldApiName, field));
		this.fieldOptions = fields.map((item) => {
			this._fields.set(`${item.fieldApiName}`, item);
			if (item.isNameField) requiredOptions.push(`${item.fieldApiName}`);
			return {
				label: `${item.fieldLabel} (${item.fieldApiName})`,
				value: `${item.fieldApiName}`
			};
		});
		if (dualListBox) dualListBox.showActivityIndicator = false;
		this.requiredFieldOptions = [...requiredOptions];
	}

	async handleSobjectSelected(event) {
		this._selectedSobject = `${event.detail.value}`;
		this._selectedFields = [];
		this._fields.clear();
		this.requiredFieldOptions = [];
		this.fieldOptions = [];
		this.loadingFields = true;
	}

	handleFieldSelection(event) {
		this._selectedFields = [...event.detail.value];
	}

	handleCancel() {
		this.dispatchEvent(new CustomEvent('cancel'));
	}

	handleSave() {
		const { label, labelPlural, apiName } = this._sobjects.get(this._selectedSobject);
		this.dispatchEvent(
			new CustomEvent('save', {
				detail: {
					objectLabel: label,
					labelPlural,
					objectApiName: apiName,
					fields: this._selectedFields.map((field) => this._fields.get(field))
				}
			})
		);
	}
}
