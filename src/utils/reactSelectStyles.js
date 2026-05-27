import { BRAND } from '../constants/brand';

/** Above sticky header (9999) and field labels; below modals/toasts. */
export const REACT_SELECT_MENU_Z_INDEX = 10005;

export function createReactSelectStyles({
  fontSize = '14px',
  multiValueLabelSize,
  menuPortalZIndex,
} = {}) {
  const labelSize = multiValueLabelSize ?? fontSize;

  const styles = {
    control: (base, state) => ({
      ...base,
      fontWeight: 'bold',
      backgroundColor: '#f8fafc',
      borderRadius: '0.75rem',
      borderWidth: '1px',
      borderColor: state.isFocused ? BRAND.DEFAULT : '#777',
      boxShadow: state.isFocused ? `0 0 0 2px ${BRAND.FOCUS_RING}` : 'none',
      padding: '2px',
      '&:hover': { borderColor: '#cbd5e1' },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#444',
      transition: 'all 0.2s ease',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: BRAND.TINT,
      borderRadius: '0.5rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: BRAND.DEFAULT,
      fontWeight: '700',
      fontSize: labelSize,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: BRAND.DEFAULT,
      '&:hover': {
        backgroundColor: BRAND.DEFAULT,
        color: 'white',
        borderRadius: '0.5rem',
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? BRAND.DEFAULT : state.isFocused ? BRAND.TINT : 'white',
      color: state.isSelected ? 'white' : state.isFocused ? BRAND.DEFAULT : '#475569',
      fontWeight: 'bold',
      fontSize,
      '&:active': { backgroundColor: BRAND.DEFAULT },
    }),
    singleValue: (base) => ({
      ...base,
      fontSize,
      fontWeight: 'bold',
      color: '#1e293b',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize,
      fontWeight: 'bold',
      color: '#94a3b8',
    }),
    input: (base) => ({
      ...base,
      fontSize,
    }),
  };

  if (menuPortalZIndex) {
    styles.menuPortal = (base) => ({ ...base, zIndex: menuPortalZIndex });
    styles.menu = (base) => ({
      ...base,
      backgroundColor: 'white',
      zIndex: menuPortalZIndex,
      borderRadius: '1rem',
      marginTop: '4px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    });
    styles.menuList = (base) => ({
      ...base,
      backgroundColor: 'white',
      borderRadius: '1rem',
    });
  }

  return styles;
}
