import axios from 'axios';
import useSWRMutation from 'swr/mutation';

const BASE_URL = 'https://shift-backend.onrender.com';

interface OtpResponse {
    success: boolean;
    retryDelay: number;
}

interface SignInResponse {
    success: boolean;
    token: string;
}

async function fetcherPost(url: string, { arg }: { arg: any }) {
    const response = await axios.post(`${BASE_URL}${url}`, arg);
    return response.data;
}

//Запрос для otp-кода
export function useRequestOtp() {
    return useSWRMutation<OtpResponse, Error, string, { phone: string }>(
        '/auth/otp',
        fetcherPost
    );
}

//Запрос для входа
export function useSignIn() {
    return useSWRMutation<SignInResponse, Error, string, { phone: string; code: string }>(
        '/users/signin',
        fetcherPost
    );
}