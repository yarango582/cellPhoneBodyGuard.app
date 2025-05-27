# SecureWipe - Aplicación Móvil

## Descripción
SecureWipe es una aplicación móvil que permite a los usuarios proteger sus dispositivos móviles contra robos y accesos no autorizados, ofreciendo funcionalidades como bloqueo remoto, borrado de datos y seguimiento de dispositivos.

## Configuración del Proyecto

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)

### Instalación
1. Clona este repositorio
2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

### Variables de Entorno
Para ejecutar este proyecto, necesitarás configurar las variables de entorno:

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus credenciales de Firebase:
```
FIREBASE_API_KEY=tu-api-key
FIREBASE_AUTH_DOMAIN=tu-auth-domain
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_STORAGE_BUCKET=tu-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
FIREBASE_APP_ID=tu-app-id
```

### Ejecución
Para ejecutar la aplicación en modo desarrollo:
```bash
npx expo start
```

Para ejecutar en un dispositivo Android:
```bash
npx expo run:android
```

Para ejecutar en un dispositivo iOS:
```bash
npx expo run:ios
```

## Estructura del Proyecto
```
/src
  /components - Componentes reutilizables
  /config - Configuración (Firebase, etc.)
  /screens - Pantallas de la aplicación
  /services - Servicios (autenticación, seguridad, etc.)
  /utils - Utilidades y funciones auxiliares
```

## Características Principales
- Registro y autenticación de usuarios
- Generación de claves de seguridad de 20 dígitos
- Bloqueo y desbloqueo manual de dispositivos
- Monitoreo de actividades sospechosas
- Interfaz intuitiva y fácil de usar

## Tecnologías Utilizadas
- React Native
- Expo
- Firebase (Autenticación, Firestore, Funciones)
- AsyncStorage para almacenamiento local
- React Navigation para la navegación
