import * as MailComposer from 'expo-mail-composer';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Envía un correo con la clave de seguridad al usuario
 */
export const sendSecurityKeyEmail = async (email: string, securityKey: string): Promise<boolean> => {
  try {
    // Primero intentamos usar Firebase Functions para enviar el correo
    const sendEmail = httpsCallable(functions, 'sendSecurityKeyEmail');
    await sendEmail({
      email,
      securityKey,
      subject: 'Tu clave de seguridad de SecureWipe',
    });
    return true;
  } catch (error) {
    console.error('Error al enviar correo desde Firebase:', error);
    
    // Como respaldo, intentamos usar el compositor de correo nativo
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        const emailContent = `
          <h1>SecureWipe - Tu clave de seguridad</h1>
          <p>Gracias por registrarte en SecureWipe, la aplicación que protege tu dispositivo.</p>
          <p>Tu clave de seguridad de 20 dígitos es:</p>
          <h2 style="font-family: monospace; background-color: #f0f0f0; padding: 10px; text-align: center;">${securityKey}</h2>
          <p>Guarda esta clave en un lugar seguro. La necesitarás para desbloquear tu dispositivo en caso de activación del protocolo de seguridad.</p>
          <p>No compartas esta clave con nadie.</p>
          <p>Equipo de SecureWipe</p>
        `;
        
        await MailComposer.composeAsync({
          recipients: [email],
          subject: 'Tu clave de seguridad de SecureWipe',
          body: emailContent,
          isHtml: true,
        });
        
        return true;
      } else {
        console.warn('El compositor de correo no está disponible en este dispositivo');
        return false;
      }
    } catch (mailError) {
      console.error('Error al enviar correo con el compositor nativo:', mailError);
      return false;
    }
  }
};

/**
 * Envía una notificación de actividad sospechosa
 */
export const sendSuspiciousActivityEmail = async (email: string, activityDetails: any): Promise<boolean> => {
  try {
    const sendEmail = httpsCallable(functions, 'sendSuspiciousActivityEmail');
    await sendEmail({
      email,
      activityDetails,
      subject: 'Alerta de seguridad - SecureWipe',
    });
    return true;
  } catch (error) {
    console.error('Error al enviar alerta de actividad sospechosa:', error);
    return false;
  }
};

/**
 * Envía una notificación de dispositivo bloqueado
 */
export const sendDeviceBlockedEmail = async (email: string, deviceInfo: any): Promise<boolean> => {
  try {
    const sendEmail = httpsCallable(functions, 'sendDeviceBlockedEmail');
    await sendEmail({
      email,
      deviceInfo,
      subject: 'Dispositivo bloqueado - SecureWipe',
    });
    return true;
  } catch (error) {
    console.error('Error al enviar notificación de dispositivo bloqueado:', error);
    return false;
  }
};
