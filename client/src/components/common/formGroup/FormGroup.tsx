import React from 'react';
import './formGroup.scss';

const FormGroup = (props: any) => {
  const { fieldName, register, errors, placeholder, isRequired, type, defaultValue } = props;
  return (
    <div className={'formGroup'}>
      <div className={'formGroupInfo'}>
        <label htmlFor={fieldName}>{fieldName}</label>
        {errors[fieldName] && <p>{errors[fieldName].message}</p>}
      </div>
      <input
        defaultValue={defaultValue ? defaultValue : null}
        type={type}
        placeholder={placeholder}
        {...register(fieldName, {
          required: isRequired ? 'Required field' : false,
          pattern: type === 'email' ? /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i : false,
        })}
      />
    </div>
  );
};

export default FormGroup;
