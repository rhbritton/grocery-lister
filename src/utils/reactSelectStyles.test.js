import {
  createReactSelectStyles,
  getReactSelectPortalProps,
  REACT_SELECT_MENU_MAX_HEIGHT,
} from './reactSelectStyles';
import { BRAND } from '../constants/brand';

describe('createReactSelectStyles', () => {
  it('uses brand colors for focused control borders', () => {
    const styles = createReactSelectStyles({ fontSize: '14px' });
    const control = styles.control({}, { isFocused: true });

    expect(control.borderColor).toBe(BRAND.DEFAULT);
    expect(control.boxShadow).toContain(BRAND.FOCUS_RING);
  });

  it('adds portal menu styles when menuPortalZIndex is set', () => {
    const styles = createReactSelectStyles({ menuPortalZIndex: 9999 });

    expect(styles.menuPortal({})).toEqual({ zIndex: 9999 });
    expect(styles.menu({}).zIndex).toBe(9999);
    expect(styles.menuList({}).backgroundColor).toBe('white');
    expect(styles.menuList({}).maxHeight).toBe(REACT_SELECT_MENU_MAX_HEIGHT);
    expect(styles.menuList({}).overflowY).toBe('auto');
  });

  it('returns portal props for document body menus', () => {
    expect(getReactSelectPortalProps()).toEqual({
      menuPortalTarget: document.body,
      menuPosition: 'fixed',
    });
  });
});
