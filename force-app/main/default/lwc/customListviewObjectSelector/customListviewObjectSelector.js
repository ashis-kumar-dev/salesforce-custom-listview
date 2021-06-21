import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllObjects from '@salesforce/apex/CustomListViewController.getAllSObjectNames';
import getAllFields from '@salesforce/apex/CustomListViewController.getAllFieldNames';

export default class CustomListviewObjectSelector extends LightningElement {
	@track sobjectOptions = [];
	@track fieldOptions = [];
	requiredFieldOptions = [];
	_sobjects = [];
	_fields = [];
	_selectedSobjectIndex = '';
	_selectedFieldIndices = [];

	async handleSobjectSelectionFocused(event) {
		const combobox = event.target;
		try {
			combobox.spinnerActive = true;
			this._sobjects = await getAllObjects();
			this.sobjectOptions = this._sobjects.map((item, index) => {
				return {
					label: `${item.label} (${item.apiName})`,
					value: `${index}`
				};
			});
			combobox.spinnerActive = false;
		} catch (error) {
			console.error(JSON.stringify(error));
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Something went wrong!',
					message: error.body.message,
					variant: 'error'
				})
			);
		}
	}

	async handleSobjectSelected(event) {
		this._selectedSobjectIndex = `${event.detail.value}`;
		const { apiName } = this._sobjects[parseInt(this._selectedSobjectIndex, 10)];
		try {
			const dualListBox = this.template.querySelector('lightning-dual-listbox');
			if (dualListBox) dualListBox.showActivityIndicator = true;
			const requiredOptionIndices = [];
			this._fields = await getAllFields({ objectApiName: apiName });
			this.fieldOptions = this._fields.map((item, index) => {
				if (item.isNameField) requiredOptionIndices.push(`${index}`);
				return {
					label: `${item.fieldLabel} (${item.fieldApiName})`,
					value: `${index}`
				};
			});
			if (dualListBox) dualListBox.showActivityIndicator = false;
			this.requiredFieldOptions = [...requiredOptionIndices];
		} catch (error) {
			console.error(JSON.stringify(error));
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Something went wrong!',
					message: error.body.message,
					variant: 'error'
				})
			);
		}
	}

	handleFieldSelection(event) {
		this._selectedFieldIndices = [...event.detail.value];
	}

	handleCancel() {
		this.dispatchEvent(new CustomEvent('cancel'));
	}

	handleSave() {
		const { label, labelPlural, apiName } =
			this._sobjects[parseInt(this._selectedSobjectIndex, 10)];
		this.dispatchEvent(
			new CustomEvent('save', {
				detail: {
					objectLabel: label,
					labelPlural,
					objectApiName: apiName,
					fields: this._selectedFieldIndices.map((fieldIndex) => {
						return this._fields[parseInt(fieldIndex, 10)];
					})
				}
			})
		);
	}
}
