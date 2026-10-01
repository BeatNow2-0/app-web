import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './LegalPage.css';

type LegalDocument = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

const documents: Record<string, LegalDocument> = {
  privacy: {
    title: 'Politica de Privacidad',
    updatedAt: '7 de julio de 2026',
    intro:
      'BeatNow trata los datos necesarios para identificar cuentas, operar el dashboard, almacenar contenido musical y mantener la seguridad del servicio.',
    sections: [
      {
        heading: 'Datos tratados',
        body:
          'Podemos tratar datos de cuenta, email, username, imagen de perfil, metadatos de beats, archivos subidos, actividad basica del dashboard y datos tecnicos de sesion.',
      },
      {
        heading: 'Finalidad',
        body:
          'Usamos estos datos para autenticar el acceso, mostrar el catalogo, publicar beats, gestionar perfiles, responder soporte, prevenir abuso y mejorar el producto.',
      },
      {
        heading: 'Conservacion',
        body:
          'Los datos se conservan mientras la cuenta permanezca activa o exista una necesidad tecnica, operativa o legal razonable para conservarlos.',
      },
      {
        heading: 'Proveedores',
        body:
          'Podemos apoyarnos en proveedores de infraestructura, email, analitica y monitorizacion. No vendemos datos personales.',
      },
      {
        heading: 'Derechos',
        body:
          'Puedes solicitar acceso, rectificacion, supresion o cierre de cuenta escribiendo a hola@beatnow.app.',
      },
    ],
  },
  terms: {
    title: 'Terminos de Uso',
    updatedAt: '7 de julio de 2026',
    intro:
      'El dashboard de BeatNow permite a productores subir, editar y gestionar beats. El uso del servicio exige cumplir estas condiciones basicas.',
    sections: [
      {
        heading: 'Responsabilidad de la cuenta',
        body:
          'Cada usuario es responsable de proteger sus credenciales y de toda accion realizada desde su cuenta.',
      },
      {
        heading: 'Contenido subido',
        body:
          'El usuario conserva la titularidad del contenido que sube, pero concede a BeatNow una licencia no exclusiva para alojarlo, procesarlo y mostrarlo dentro del servicio.',
      },
      {
        heading: 'Contenido prohibido',
        body:
          'No esta permitido subir contenido infractor, ilegal, engañoso, malicioso o que vulnere derechos de terceros.',
      },
      {
        heading: 'Suspension',
        body:
          'BeatNow puede retirar contenido, limitar funciones o suspender cuentas por abuso, riesgo tecnico o incumplimiento de estas condiciones.',
      },
      {
        heading: 'Servicio beta y disponibilidad',
        body:
          'La plataforma puede cambiar, interrumpirse o actualizarse sin previo aviso. No se garantiza disponibilidad continua ni ausencia total de errores.',
      },
    ],
  },
  copyright: {
    title: 'Politica de Copyright',
    updatedAt: '7 de julio de 2026',
    intro:
      'BeatNow atiende reportes razonables sobre uso no autorizado de obras protegidas y se reserva la retirada preventiva de contenido.',
    sections: [
      {
        heading: 'Reportes admitidos',
        body:
          'Se pueden reportar beats, portadas, lyrics, imagenes y perfiles que infrinjan derechos de autor o propiedad intelectual.',
      },
      {
        heading: 'Informacion necesaria',
        body:
          'El reporte debe incluir identificacion del reclamante, descripcion del material, localizacion del contenido, prueba razonable de titularidad y declaracion de buena fe.',
      },
      {
        heading: 'Medidas posibles',
        body:
          'Podemos retirar contenido, pedir informacion adicional o limitar cuentas reincidentes mientras revisamos el caso.',
      },
      {
        heading: 'Canal de contacto',
        body:
          'Los reportes deben enviarse a hola@beatnow.app con el asunto "Copyright report".',
      },
    ],
  },
};

export default function LegalPage() {
  const { document = 'privacy' } = useParams();
  const content = documents[document] ?? documents.privacy;

  return (
    <main className="legal-page-shell">
      <div className="legal-page-card">
        <div className="legal-page-nav">
          <Link to="/login">Volver</Link>
          <div className="legal-page-tabs">
            <Link to="/legal/privacy">Privacidad</Link>
            <Link to="/legal/terms">Terminos</Link>
            <Link to="/legal/copyright">Copyright</Link>
          </div>
        </div>

        <header className="legal-page-header">
          <span className="legal-page-kicker">Legal</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
          <small>Ultima actualizacion: {content.updatedAt}</small>
        </header>

        <section className="legal-page-body">
          {content.sections.map((section) => (
            <article key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
