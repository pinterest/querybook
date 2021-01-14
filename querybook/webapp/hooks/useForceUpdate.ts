import { useState } from 'react';

export const useForceUpdate: () => any = () => useState()[1];
