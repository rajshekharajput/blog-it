import React, { FC, useEffect } from 'react';
import './register.scss';
import { useForm } from 'react-hook-form';
import { Button, CircularProgress, TextField } from '@mui/material';
import { useAppDispatch, useAppSelector, useTitle } from '../../hooks';
import { authArgs, authorizeUser } from '../../store/reducers/auth/actionCreators';
import { setError } from '../../store/reducers/auth/authSlice';
import FormGroup from '../../components/common/formGroup/FormGroup';
import Hr from '../../components/common/hr/Hr';
import { Navigate } from 'react-router-dom';

const Register: FC = () => {
  const { isLoading, error, isAuth } = useAppSelector(state => state.auth)
  const { handleSubmit, formState: { errors }, register } = useForm()
  const dispatch = useAppDispatch()
  useTitle('Register')

  useEffect(() => {
    dispatch(setError(''))
  }, [dispatch])

  const onSubmit = (data: any) => {
    const args: authArgs = {
      type: 'register',
      firstName: data['First Name'],
      lastName: data['Last Name'],
      email: data['Email'],
      password: data['Password']
    }
    dispatch(authorizeUser(args))
  }

  const validateName = (value: string) => {
    if (/\d/.test(value)) {
      return 'Name should not contain numbers'
    }
    return true;
  }

  return (
    <div className={'login'}>
      {isAuth && <Navigate to={'/'} replace={true} />}
      <h2 className={'loginTitle'}>Welcome to HandsOn</h2>
      <Hr dataContent={'Register'} />
      {error && <div className={'registerError'}>
        {error}
      </div>}
      <div className={'loginForm'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup
            fieldName={'First Name'}
            register={register}
            errors={errors}
            placeholder={'Enter first name...'}
            isRequired={true}
          >
            <TextField
              type={'text'}
              inputProps={{
                ...register('First Name', {
                  required: 'First name is required',
                  validate: validateName
                })
              }}
              placeholder={'Enter first name...'}
            />
          </FormGroup>
          <FormGroup
            fieldName={'Last Name'}
            register={register}
            errors={errors}
            placeholder={'Enter last name...'}
            isRequired={true}
          >
            <TextField
              type={'text'}
              inputProps={{
                ...register('Last Name', {
                  required: 'Last name is required',
                  validate: validateName
                })
              }}
              placeholder={'Enter last name...'}
            />
          </FormGroup>
          <FormGroup
            fieldName={'Email'}
            register={register}
            errors={errors}
            placeholder={'Enter email...'}
            isRequired={true}
          />
          <FormGroup
            fieldName={'Password'}
            register={register}
            errors={errors}
            placeholder={'Enter password...'}
            isRequired={true}
            type={'password'}
          />
          <Button
            type={'submit'}
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress style={{ color: 'white' }} size={20} /> : null}
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;
