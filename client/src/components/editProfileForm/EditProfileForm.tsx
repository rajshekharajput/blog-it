import React, { FC } from 'react';
import './editProfileForm.scss';
import Button from '../common/button/Button';
import { TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks';
import UserService from '../../services/user-service';
import { setUser } from '../../store/reducers/auth/authSlice';

interface EditProfileFormProps {
  file: File | null;
  setFile: any;
}

interface EditProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

const EditProfileForm: FC<EditProfileFormProps> = ({ file, setFile }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<EditProfileFormData>();
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    setFile(null);
  }, [setFile]);

  const onSubmit = (data: EditProfileFormData) => {
    setMessage('');
    const { firstName, lastName, email } = data;
    if (
      user.firstName === firstName &&
      user.lastName === lastName &&
      user.email === email &&
      !file
    ) {
      setMessage('Please make changes to the fields!');
    } else {
      UserService.updateUser(user.id, firstName, lastName, email, file)
        .then((response) => {
          dispatch(setUser(response.data));
          setMessage('Changes saved!');
        })
        .catch((error) => setMessage(error.message));
    }
  };

  return (
    <form className={'editProfileForm'} onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="First Name"
        variant="outlined"
        fullWidth
        {...register('firstName', {
          required: 'First name is required',
          pattern: {
            value: /^[A-Za-z]+$/i,
            message: 'Name should contain only letters',
          },
        })}
        error={!!errors.firstName}
        helperText={errors?.firstName?.message}
      />

      <TextField
        label="Last Name"
        variant="outlined"
        fullWidth
        {...register('lastName', {
          required: 'Last name is required',
          pattern: {
            value: /^[A-Za-z]+$/i,
            message: 'Name should contain only letters',
          },
        })}
        error={!!errors.lastName}
        helperText={errors?.lastName?.message}
      />

      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Invalid email format',
          },
        })}
        error={!!errors.email}
        helperText={errors?.email?.message}
      />

      <div className={'submitProfileChanges'}>
        <div className={'profileSaveBtn'}>
          <Button type={'submit'} text={'Save'} />
        </div>
        {message && (
          <span className={message === 'Changes saved!' ? 'submitSuccess' : 'submitError'}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
};

export default EditProfileForm;
