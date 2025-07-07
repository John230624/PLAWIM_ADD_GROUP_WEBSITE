// types/kkiapay.d.ts
// Déclaration du composant personnalisé Kakapay pour TypeScript

declare global {
  interface Window {
    KkiapayWidget: any;
  }

  namespace JSX {
    interface IntrinsicElements {
      'kkiapay-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        amount?: number;
        api_key?: string;
        callback?: string;
        transaction_id?: string;
        email?: string;
        phone?: string;
        position?: 'center' | 'bottom';
        sandbox?: boolean;
      };
    }
  }
}

export {};
