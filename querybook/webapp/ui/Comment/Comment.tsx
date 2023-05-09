import { Formik } from 'formik';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { UserName } from 'components/UserBadge/UserName';
import { generateFormattedDate } from 'lib/utils/datetime';
import { IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { InputField } from 'ui/FormikField/InputField';
import { StyledText } from 'ui/StyledText/StyledText';

import './Comment.scss';

export const Comment: React.FunctionComponent = () => {
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    return (
        <div className="Comment">
            <div className="Comment-form flex-row">
                <UserAvatar uid={userInfo?.uid} tiny />
                <Formik initialValues={{}} onSubmit={() => null}>
                    <InputField className="ml12 mr16" name="comment" />
                </Formik>
                <Button color="light" title="Comment" />
            </div>
            <div className="Comment-list mt8">
                <div className="Comment-past mt8">
                    <div className="Comment-past-top flex-row">
                        <UserAvatar uid={userInfo?.uid} tiny />
                        <UserName uid={userInfo?.uid} />
                        <StyledText color="lightest" cursor="default">
                            commented on
                        </StyledText>
                        <StyledText color="lightest" cursor="default">
                            {generateFormattedDate(1683662936)}
                        </StyledText>
                    </div>
                    <div className="Comment-past-comment mt8 p12">
                        <StyledText>my editable Comment text</StyledText>
                        <div className="Comment-past-comment-bottom mt8 horizontal-space-between">
                            <div className="Comment-reactions flex-row">
                                <div className="Comment-reaction mr8 ph8 flex-row">
                                    <StyledText size="smedium">😍</StyledText>
                                    <StyledText
                                        weight="bold"
                                        color="lightest"
                                        className="ml8"
                                        size="small"
                                        cursor="default"
                                    >
                                        2
                                    </StyledText>
                                </div>
                                <div className="Comment-reaction mr8 ph8 flex-row active">
                                    <StyledText size="smedium">🩵</StyledText>
                                    <StyledText
                                        weight="bold"
                                        color="accent"
                                        className="ml8"
                                        size="small"
                                        cursor="default"
                                    >
                                        2
                                    </StyledText>
                                </div>
                                <div className="Comment-reaction-button">
                                    <IconButton
                                        icon="Plus"
                                        invertCircle
                                        size={18}
                                        tooltip="Add Reaction"
                                        tooltipPos="right"
                                    />
                                </div>
                            </div>
                            <div className="Comment-edit">
                                <IconButton
                                    icon="Edit"
                                    invertCircle
                                    size={18}
                                    tooltip="Edit Comment"
                                    tooltipPos="left"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="Comment-past mt8">
                    <div className="Comment-past-top flex-row">
                        <UserAvatar uid={11} tiny />
                        <UserName uid={11} />
                        <StyledText color="lightest" cursor="default">
                            commented on
                        </StyledText>
                        <StyledText color="lightest" cursor="default">
                            {generateFormattedDate(1683663036)}
                        </StyledText>
                    </div>
                    <div className="Comment-past-comment mt8 p12">
                        <StyledText> Comment text</StyledText>
                        <div className="Comment-past-comment-bottom mt8 horizontal-space-between">
                            <div className="Comment-reactions flex-row">
                                <div className="Comment-reaction ph8 flex-row">
                                    <StyledText size="smedium">🍉</StyledText>
                                    <StyledText
                                        weight="bold"
                                        color="lightest"
                                        className="ml8"
                                        size="small"
                                        cursor="default"
                                    >
                                        2
                                    </StyledText>
                                </div>
                                <div className="Comment-reaction-button ml8">
                                    <IconButton
                                        icon="Plus"
                                        invertCircle
                                        size={18}
                                        tooltip="Add Reaction"
                                        tooltipPos="right"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
