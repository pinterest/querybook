import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAppBlurred } from 'redux/dataHubUI/action';

export const useAppBlur = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setAppBlurred(true));

        return () => {
            dispatch(setAppBlurred(false));
        };
    }, []);
};
