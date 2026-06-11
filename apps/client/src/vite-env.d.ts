/// <reference types="vite/client" />

// Allow importing CSS Modules
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

// Allow importing plain CSS files
declare module '*.css' {
  const content: string;
  export default content;
}
