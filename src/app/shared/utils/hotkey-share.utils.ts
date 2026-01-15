import {
    IHotkeyProfile,
    IShareProfileItem,
    IHotkeyProfileCreate,
    isShareProfileItem,
} from '../models/hotkeys.models';

/** Transform profile to share format (remove id for portability) */
export function transformProfileToShare(
    profile: IHotkeyProfile,
): IShareProfileItem {
    const { id, ...profileWithoutId } = profile;
    return { type: 'profile', value: profileWithoutId };
}

/** Transform share format back to profile create data (generate new id later) */
export function transformShareToProfile(
    shareItem: IShareProfileItem,
): IHotkeyProfileCreate {
    return {
        title: shareItem.value.title,
        config: shareItem.value.config,
    };
}

/** Validate clipboard content as share format */
export function validateShareFormat(text: string): IShareProfileItem | null {
    try {
        const parsed = JSON.parse(text);
        return isShareProfileItem(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

/** Serialize share item to JSON string for clipboard */
export function serializeShareItem(shareItem: IShareProfileItem): string {
    return JSON.stringify(shareItem, null, 2);
}
