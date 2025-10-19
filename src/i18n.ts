import i18n from 'i18next';

const resources = {
  es: {
    translation: {
      'articulos': 'artículos',
      'advertencia_incompleto': 'Advertencia: Algunos artículos no tienen límites definidos. Disponibilidad aproximada: {{percent}}%',
      'disponibilidad': 'Disponibilidad: {{percent}}%',
      'incrementar_valor': 'Incrementar valor',
      'disminuir_valor': 'Disminuir valor',
      'algunos_sin_limite': 'Algunos artículos no tienen límites definidos',
    }
  },
  en: {
    translation: {
      'articulos': 'items',
      'advertencia_incompleto': 'Warning: Some items have no limits defined. Approximate availability: {{percent}}%',
      'disponibilidad': 'Availability: {{percent}}%',
      'incrementar_valor': 'Increment value',
      'disminuir_valor': 'Decrement value',
      'algunos_sin_limite': 'Some items have no limits defined',
    }
  }
};

export function initI18n() {
  // Solo inicializar en cliente
  if (globalThis.window === undefined) return;

  if (!i18n.isInitialized) {
    // Importar react-i18next dinámicamente solo en cliente para evitar errores en SSR
    import('react-i18next').then(({ initReactI18next }) => {
      i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: 'es',
          fallbackLng: 'es',
          interpolation: {
            escapeValue: false,
          },
        });
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load react-i18next for client-side i18n initialization', err);
    });
  }
}

export default i18n;
