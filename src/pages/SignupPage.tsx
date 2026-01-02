import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Logo from '../components/common/Logo';
import { useTimer } from '../hooks/useTimer';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        verificationCode: '',
        nickname: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});
    const [isUsernameChecked, setIsUsernameChecked] = useState(false);
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { formattedTime, start, reset, isExpired } = useTimer({
        initialSeconds: 180, // 3 minutes
        onExpire: () => {
            setErrors((prev) => ({ ...prev, verificationCode: '인증번호가 만료되었습니다. 재발송해주세요' }));
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Reset specific states when input changes
        if (name === 'username') setIsUsernameChecked(false);
        if (name === 'nickname') setIsNicknameChecked(false);
        if (name === 'email') {
            setIsEmailSent(false);
            setIsEmailVerified(false);
            reset();
        }

        // Clear error for the field being edited
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        if (successMessages[name]) {
            setSuccessMessages((prev) => {
                const newMsgs = { ...prev };
                delete newMsgs[name];
                return newMsgs;
            });
        }
    };

    const handleUsernameCheck = () => {
        if (formData.username.length < 6) {
            setErrors((prev) => ({ ...prev, username: '아이디는 6자 이상이어야 합니다' }));
            return;
        }
        // Mock API call
        setTimeout(() => {
            setIsUsernameChecked(true);
            setSuccessMessages((prev) => ({ ...prev, username: '사용 가능한 아이디입니다.' }));
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.username;
                return newErrors;
            });
        }, 500);
    };

    const handleNicknameCheck = () => {
        if (formData.nickname.length < 2) {
            setErrors((prev) => ({ ...prev, nickname: '닉네임은 2자 이상이어야 합니다' }));
            return;
        }
        // Mock API call
        setTimeout(() => {
            setIsNicknameChecked(true);
            setSuccessMessages((prev) => ({ ...prev, nickname: '사용 가능한 닉네임입니다.' }));
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.nickname;
                return newErrors;
            });
        }, 500);
    };

    const handleSendEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요' }));
            return;
        }

        // Mock API call
        setTimeout(() => {
            setIsEmailSent(true);
            start();
            setSuccessMessages((prev) => ({ ...prev, email: '인증번호가 발송되었습니다.' }));
        }, 500);
    };

    const handleVerifyEmail = () => {
        if (isExpired) return;
        if (formData.verificationCode === '123456') { // Mock verification code
            setIsEmailVerified(true);
            setSuccessMessages((prev) => ({ ...prev, email: '인증이 완료되었습니다.' }));
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.verificationCode;
                return newErrors;
            });
        } else {
            setErrors((prev) => ({ ...prev, verificationCode: '인증번호가 일치하지 않습니다' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!isUsernameChecked) newErrors.username = '아이디 중복확인을 해주세요';
        if (!isNicknameChecked) newErrors.nickname = '닉네임 중복확인을 해주세요';
        if (!isEmailVerified) newErrors.email = '이메일 인증을 완료해주세요';

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{12,})/;
        if (!passwordRegex.test(formData.password)) {
            newErrors.password = '비밀번호는 대문자, 소문자, 특수문자를 포함하여 12자 이상이어야 합니다';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Success
        alert('회원가입이 완료되었습니다!');
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF5FF] via-[#F5F5F4] to-[#FFF7ED] py-10 px-4">
            <div className="w-full max-w-[400px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <Logo className="mb-8" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        label="아이디"
                        id="username"
                        name="username"
                        placeholder="아이디를 입력하세요"
                        value={formData.username}
                        onChange={handleChange}
                        error={errors.username}
                        successMessage={successMessages.username}
                        actionButton={
                            <Button
                                type="button"
                                variant={isUsernameChecked ? 'ghost' : 'secondary'}
                                onClick={handleUsernameCheck}
                                disabled={isUsernameChecked || !formData.username}
                                className="shrink-0 flex items-stretch min-w-[100px]"
                            >
                                {isUsernameChecked ? '✓ 사용가능' : '중복확인'}
                            </Button>
                        }
                    />

                    <Input
                        label="비밀번호"
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 입력하세요"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        innerAction={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="input-toggle-btn"
                                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        }
                    />

                    <Input
                        label="비밀번호 재입력"
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 다시 입력하세요"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        innerAction={
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="input-toggle-btn"
                                aria-label={showConfirmPassword ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        }
                    />

                    <div className="flex flex-col gap-3">
                        <Input
                            label="이메일"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="이메일을 입력하세요"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            disabled={isEmailVerified}
                            actionButton={
                                <Button
                                    type="button"
                                    variant={isEmailVerified ? 'ghost' : 'secondary'}
                                    onClick={handleSendEmail}
                                    disabled={isEmailVerified || !formData.email}
                                    className="shrink-0 flex items-stretch min-w-[100px]"
                                >
                                    {isEmailVerified ? '✓ 인증완료' : isEmailSent ? '재발송' : '인증번호 발송'}
                                </Button>
                            }
                        />

                        {isEmailSent && !isEmailVerified && (
                            <Input
                                placeholder="인증번호를 입력하세요"
                                id="verificationCode"
                                name="verificationCode"
                                value={formData.verificationCode}
                                onChange={handleChange}
                                error={errors.verificationCode}
                                successMessage={!isExpired ? `인증번호가 발송되었습니다. (${formattedTime})` : ''}
                                actionButton={
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleVerifyEmail}
                                        disabled={!formData.verificationCode || isExpired}
                                        className="shrink-0 flex items-stretch min-w-[100px]"
                                    >
                                        확인
                                    </Button>
                                }
                            />
                        )}
                    </div>

                    <Input
                        label="닉네임"
                        id="nickname"
                        name="nickname"
                        placeholder="닉네임을 입력하세요"
                        value={formData.nickname}
                        onChange={handleChange}
                        error={errors.nickname}
                        successMessage={successMessages.nickname}
                        actionButton={
                            <Button
                                type="button"
                                variant={isNicknameChecked ? 'ghost' : 'secondary'}
                                onClick={handleNicknameCheck}
                                disabled={isNicknameChecked || !formData.nickname}
                                className="shrink-0 flex items-stretch min-w-[100px]"
                            >
                                {isNicknameChecked ? '✓ 사용가능' : '중복확인'}
                            </Button>
                        }
                    />

                    <Button type="submit" fullWidth size="lg" className="mt-4">
                        회원가입
                    </Button>
                </form>

                <p className="text-center mt-6 text-sm text-neutral-600">
                    이미 계정이 있으신가요?{' '}
                    <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
                        로그인
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
