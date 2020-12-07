import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAppBlurred } from 'redux/globalUI/action';

export const useAppBlur = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setAppBlurred(true));

        return () => {
            dispatch(setAppBlurred(false));
        };
    }, []);
};
