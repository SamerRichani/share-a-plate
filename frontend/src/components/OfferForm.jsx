import { useState } from 'react';
import { fromDateTimeLocal, toDateTimeLocal } from '../utils/format';
import Button from './ui/Button';
import TextField from './ui/TextField';

function OfferForm({ initialOffer, onSubmit, submitting }) {
  const [values, setValues] = useState(() => ({
    title: initialOffer?.title || '',
    description: initialOffer?.description || '',
    category: initialOffer?.category || '',
    area: initialOffer?.area || '',
    location: initialOffer?.location || '',
    quantity: initialOffer?.quantity ?? '',
    pickup_start: toDateTimeLocal(initialOffer?.pickup_start),
    pickup_deadline: toDateTimeLocal(initialOffer?.pickup_deadline),
  }));
  const [formError, setFormError] = useState('');

  function update(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');

    if (
      !values.pickup_start ||
      !values.pickup_deadline ||
      new Date(values.pickup_deadline) <= new Date(values.pickup_start)
    ) {
      setFormError('Pickup deadline must be later than the pickup start.');
      return;
    }

    try {
      await onSubmit({
        ...values,
        quantity: Number(values.quantity),
        pickup_start: fromDateTimeLocal(values.pickup_start),
        pickup_deadline: fromDateTimeLocal(values.pickup_deadline),
      });
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <form className="form-card offer-form" onSubmit={submit}>
      {formError && (
        <div className="alert alert--error" role="alert">
          {formError}
        </div>
      )}
      <TextField
        id="title"
        label="Offer name"
        name="title"
        maxLength={200}
        placeholder="e.g. Fresh bread and pastries"
        required
        value={values.title}
        onChange={update}
      />
      <div className="field">
        <label className="field__label" htmlFor="description">
          Description <span className="field__optional">(optional)</span>
        </label>
        <textarea
          className="field__input field__textarea"
          id="description"
          name="description"
          maxLength={2000}
          placeholder="Tell people a little more about the food."
          rows="4"
          value={values.description}
          onChange={update}
        />
      </div>
      <div className="form-grid">
        <TextField
          id="category"
          label="Category"
          name="category"
          maxLength={200}
          placeholder="e.g. bakery"
          required
          value={values.category}
          onChange={update}
        />
        <TextField
          id="area"
          label="Area"
          name="area"
          maxLength={200}
          placeholder="e.g. downtown"
          required
          value={values.area}
          onChange={update}
        />
      </div>
      <TextField
        id="location"
        label="Collection location"
        name="location"
        maxLength={200}
        placeholder="Street address or collection point"
        required
        value={values.location}
        onChange={update}
      />
      <TextField
        id="quantity"
        label="Total portions"
        name="quantity"
        type="number"
        min="1"
        step="1"
        required
        value={values.quantity}
        onChange={update}
      />
      <div className="form-grid">
        <TextField
          id="pickup_start"
          label="Pickup starts"
          name="pickup_start"
          type="datetime-local"
          required
          value={values.pickup_start}
          onChange={update}
        />
        <TextField
          id="pickup_deadline"
          label="Pickup deadline"
          name="pickup_deadline"
          type="datetime-local"
          required
          value={values.pickup_deadline}
          onChange={update}
        />
      </div>
      <div className="form-actions">
        <Button disabled={submitting} type="submit">
          {submitting
            ? 'Saving…'
            : initialOffer
              ? 'Save changes'
              : 'Publish offer'}
        </Button>
      </div>
    </form>
  );
}

export default OfferForm;
