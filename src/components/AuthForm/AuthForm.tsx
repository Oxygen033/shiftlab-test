import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRequestOtp, useSignIn } from './apiRequests';
import { useAuthStore } from '../../stores/authStore';
import './AuthForm.scss';

interface AuthFormData {
    phone: string;
    code: string;
}

const AuthForm = () => {
    const { phone: storedPhone, setPhone, setToken, reset: resetStore } = useAuthStore();
    const [isCodeStep, setIsCodeStep] = useState(!!storedPhone);
    const [countdown, setCountdown] = useState(0);
    const [canRequestNewCode, setCanRequestNewCode] = useState(false);

    const { trigger: requestOtp, isMutating: isRequestingOtp } = useRequestOtp();
    const { trigger: signIn, isMutating: isSigningIn } = useSignIn();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset: resetForm,
        trigger: triggerValidation,
    } = useForm<AuthFormData>({
        defaultValues: {
            phone: storedPhone || '',
            code: '',
        },
        mode: 'onChange',
    });

    //Форматирование номера (удаление не-цифр и пробелы)
    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (!numbers) return '';

        let formatted = '+';
        if (numbers.length > 0) formatted += numbers.substring(0, 1);
        if (numbers.length > 1) formatted += ' ' + numbers.substring(1, 4);
        if (numbers.length > 4) formatted += ' ' + numbers.substring(4, 7);
        if (numbers.length > 7) formatted += ' ' + numbers.substring(7, 9);
        if (numbers.length > 9) formatted += ' ' + numbers.substring(9, 11);

        return formatted;
    };

    const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (!value.startsWith('+')) value = '+' + value;
        setValue('phone', formatPhoneNumber(value), { shouldValidate: true });
        await triggerValidation('phone');
    };

    //Форматирование для поля кода
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setValue('code', value, { shouldValidate: true });
    };

    //Отправка телефона и получение кода
    const handleContinue = async (data: AuthFormData) => {
        if (!data.phone.trim()) {
            return;
        }

        try {
            const phoneNumber = data.phone.replace(/\D/g, '');
            const response = await requestOtp({ phone: phoneNumber });

            if (response) {
                setPhone(data.phone);
                setIsCodeStep(true);
                setCountdown(Math.ceil(response.retryDelay / 1000));
                setCanRequestNewCode(false);
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
        }
    };

    //Обработка входа
    const handleLogin = async (data: AuthFormData) => {
        try {
            const phoneNumber = data.phone.replace(/\D/g, '');
            const response = await signIn({
                phone: phoneNumber,
                code: data.code
            });

            if (response?.token) {
                setToken(response.token); //Если токен получен в ответе, то сохранить его
            }
        } catch (error) {
            console.error('Error signing in:', error);
        }
        resetApp();
    };

    //Сброс всех данных для отладки
    const resetApp = () => {
        resetStore();
        resetForm({ phone: '', code: '' });
        setIsCodeStep(false);
    };

    //Таймер для запроса нового кода
    useEffect(() => {
        let timer: number;
        if (isCodeStep && countdown > 0) {
            timer = window.setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setCanRequestNewCode(true);
        }
        return () => window.clearInterval(timer);
    }, [isCodeStep, countdown]);

    return (
        <form onSubmit={handleSubmit(isCodeStep ? handleLogin : handleContinue)} className="auth-form-container">
            <h2>Вход</h2>
            <p>Введите номер телефона для входа в личный кабинет</p>
            <div className="form-group">
                <input
                    {...register('phone', {
                        required: true,
                        pattern: {
                            value: /^\+\d[\d\s]*$/,
                            message: 'Некорректный формат номера'
                        },
                        validate: {
                            notEmpty: (value) => value.trim() !== '' || 'Поле является обязательным'
                        }
                    })}
                    placeholder="Телефон"
                    onChange={handlePhoneChange}
                    className={errors.phone ? 'input-error' : 'input-default'}
                />
                {errors.phone && (
                    <span className="error-message">
                        {errors.phone.message || 'Поле является обязательным'}
                    </span>
                )}
            </div>

            {isCodeStep && (
                <>
                    <div className="form-group">
                        <input
                            {...register('code', {
                                required: 'Код должен содержать 6 цифр',
                                pattern: {
                                    value: /^\d{6}$/,
                                    message: 'Код должен содержать 6 цифр'
                                }
                            })}
                            placeholder="Проверочный код"
                            maxLength={6}
                            className={errors.code ? 'input-error' : 'input-default'}
                        />
                        {errors.code && (
                            <span className="error-message">{errors.code.message}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="button-primary"
                        disabled={isRequestingOtp || isSigningIn}
                    >
                        {isCodeStep ? 'Войти' : 'Продолжить'}
                    </button>

                    {canRequestNewCode ? (
                        <button
                            type="button"
                            onClick={() => {
                                handleContinue({ phone: watch('phone'), code: '' });
                            }}
                            className="code-request-link active"
                            disabled={isRequestingOtp}
                        >
                            Запросить код еще раз
                        </button>
                    ) : (
                        <p className='code-request-link'>Запросить код повторно можно через {countdown} секунд</p>
                    )}
                </>
            )}
        </form>
    );
};

export default AuthForm;