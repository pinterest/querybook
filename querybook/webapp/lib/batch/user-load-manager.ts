import ds from 'lib/datasource';
import { BatchManager, mergeSetFunction } from 'lib/batch/batch-manager';
import { Dispatch } from 'redux/store/types';

class UserLoadManager {
    private dispatch: Dispatch;
    private batchLoadUserManager = new BatchManager<number, number[]>({
        batchFrequency: 500,
        processFunction: async (userIds: number[]) => {
            const { data: userInfos } = await ds.save(`/batch/user/`, {
                uids: userIds,
            });
            for (const userInfo of userInfos) {
                this.dispatch({
                    type: '@@user/RECEIVE_USER',
                    payload: userInfo,
                });
            }
        },
        mergeFunction: mergeSetFunction,
    });

    public loadUser(uid: number, dispatch: Dispatch) {
        this.dispatch = dispatch;
        return this.batchLoadUserManager.batch(uid);
    }
}

export const userLoadManager = new UserLoadManager();
