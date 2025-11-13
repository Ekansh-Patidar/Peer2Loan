import { useState } from 'react';
import './GroupForm.css';

const GroupForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    monthlyContribution: initialData.monthlyContribution || '',
    groupSize: initialData.groupSize || '',
    startDate: initialData.startDate || '',
    description: initialData.description || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    }

    if (!formData.monthlyContribution) {
      newErrors.monthlyContribution = 'Monthly contribution is required';
    } else if (formData.monthlyContribution < 100) {
      newErrors.monthlyContribution = 'Contribution must be at least ₹100';
    }

    if (!formData.groupSize) {
      newErrors.groupSize = 'Group size is required';
    } else if (formData.groupSize < 2) {
      newErrors.groupSize = 'Group must have at least 2 members';
    } else if (formData.groupSize > 50) {
      newErrors.groupSize = 'Group cannot exceed 50 members';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const selectedDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="group-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Group Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="e.g., Family Savings Group"
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="monthlyContribution">Monthly Contribution (₹) *</label>
        <input
          type="number"
          id="monthlyContribution"
          name="monthlyContribution"
          value={formData.monthlyContribution}
          onChange={handleChange}
          className={errors.monthlyContribution ? 'error' : ''}
          placeholder="5000"
          min="100"
        />
        {errors.monthlyContribution && (
          <span className="error-message">{errors.monthlyContribution}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="groupSize">Group Size *</label>
        <input
          type="number"
          id="groupSize"
          name="groupSize"
          value={formData.groupSize}
          onChange={handleChange}
          className={errors.groupSize ? 'error' : ''}
          placeholder="10"
          min="2"
          max="50"
        />
        {errors.groupSize && (
          <span className="error-message">{errors.groupSize}</span>
        )}
        <small className="help-text">Number of members (2-50)</small>
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Start Date *</label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className={errors.startDate ? 'error' : ''}
        />
        {errors.startDate && (
          <span className="error-message">{errors.startDate}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (Optional)</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add any additional details about the group..."
          rows="4"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (initialData.name ? 'Update Group' : 'Create Group')}
        </button>
      </div>
    </form>
  );
};

export default GroupForm;