const supabase = require('../config/supabase');

// Columnas de la tabla public.jobs que se pueden enviar al CREAR
const CAMPOS_CREAR = [
    'company_id', 'created_by', 'job_title', 'description', 'requirements',
    'responsibilities', 'employment_type', 'work_modality', 'country',
    'department', 'city', 'salary_min', 'salary_max', 'salary_currency',
    'experience_required', 'education_required', 'vacancies',
    'publication_status', 'publication_date', 'expiration_date'
];

// Al EDITAR no se permite cambiar quién la creó
const CAMPOS_EDITAR = CAMPOS_CREAR.filter((c) => c !== 'created_by');

// Trae también los datos básicos de la empresa de cada oferta
const SELECT_OFERTA = '*, company:companies(id, business_name, city, logo)';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuid = (valor) => typeof valor === 'string' && UUID.test(valor);

// Toma solo los campos permitidos del body (req.body puede venir vacío)
const tomarCampos = (body, permitidos) => {
    const datos = {};
    permitidos.forEach((campo) => {
        if (body && body[campo] !== undefined) datos[campo] = body[campo];
    });
    return datos;
};

const salarioInvalido = (datos) =>
    datos.salary_min !== undefined &&
    datos.salary_max !== undefined &&
    Number(datos.salary_min) > Number(datos.salary_max);

// Traduce los errores de Postgres a respuestas claras
const errorBD = (res, error, mensaje) => {
    if (error.code === '23503') {
        return res.status(400).json({ success: false, mensaje: 'El company_id o created_by no existe' });
    }
    if (error.code === '22P02' || error.code === '23514') {
        return res.status(400).json({ success: false, mensaje: 'Algún dato tiene un formato inválido', error: error.message });
    }
    return res.status(500).json({ success: false, mensaje, error: error.message });
};

const errorInterno = (res, error) => {
    console.error(error);
    return res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
};

// GET /api/jobs
// Filtros opcionales: ?publication_status=published&company_id=...&city=La Paz&work_modality=remote
const obtenerOfertas = async (req, res) => {
    try {
        const { publication_status, company_id, city, work_modality } = req.query;

        let consulta = supabase.from('jobs').select(SELECT_OFERTA);

        if (publication_status) consulta = consulta.eq('publication_status', publication_status);
        if (work_modality) consulta = consulta.eq('work_modality', work_modality);
        if (city) consulta = consulta.ilike('city', `%${city}%`);
        if (company_id) {
            if (!esUuid(company_id)) {
                return res.status(400).json({ success: false, mensaje: 'company_id no es un uuid válido' });
            }
            consulta = consulta.eq('company_id', company_id);
        }

        const { data, error } = await consulta.order('created_at', { ascending: false });

        if (error) return errorBD(res, error, 'Error al consultar ofertas');

        res.status(200).json({ success: true, total: data.length, ofertas: data });
    } catch (error) {
        errorInterno(res, error);
    }
};

// GET /api/jobs/:id
const obtenerOfertaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!esUuid(id)) {
            return res.status(400).json({ success: false, mensaje: 'El id no es un uuid válido' });
        }

        const { data, error } = await supabase
            .from('jobs')
            .select(SELECT_OFERTA)
            .eq('id', id)
            .maybeSingle();

        if (error) return errorBD(res, error, 'Error al consultar la oferta');
        if (!data) return res.status(404).json({ success: false, mensaje: 'Oferta no encontrada' });

        res.status(200).json({ success: true, oferta: data });
    } catch (error) {
        errorInterno(res, error);
    }
};

// POST /api/jobs
const crearOferta = async (req, res) => {
    try {
        const datos = tomarCampos(req.body, CAMPOS_CREAR);

        if (!datos.company_id || !datos.job_title) {
            return res.status(400).json({ success: false, mensaje: 'Los campos company_id y job_title son obligatorios' });
        }
        if (!esUuid(datos.company_id)) {
            return res.status(400).json({ success: false, mensaje: 'company_id no es un uuid válido' });
        }
        if (datos.created_by && !esUuid(datos.created_by)) {
            return res.status(400).json({ success: false, mensaje: 'created_by no es un uuid válido' });
        }
        if (salarioInvalido(datos)) {
            return res.status(400).json({ success: false, mensaje: 'salary_min no puede ser mayor que salary_max' });
        }

        const { data, error } = await supabase
            .from('jobs')
            .insert([datos])
            .select(SELECT_OFERTA)
            .single();

        if (error) return errorBD(res, error, 'Error al crear la oferta');

        res.status(201).json({ success: true, mensaje: 'Oferta creada correctamente', oferta: data });
    } catch (error) {
        errorInterno(res, error);
    }
};

// PUT /api/jobs/:id
const actualizarOferta = async (req, res) => {
    try {
        const { id } = req.params;
        const datos = tomarCampos(req.body, CAMPOS_EDITAR);

        if (!esUuid(id)) {
            return res.status(400).json({ success: false, mensaje: 'El id no es un uuid válido' });
        }
        if (Object.keys(datos).length === 0) {
            return res.status(400).json({ success: false, mensaje: 'Envía al menos un campo para actualizar' });
        }
        if (datos.company_id && !esUuid(datos.company_id)) {
            return res.status(400).json({ success: false, mensaje: 'company_id no es un uuid válido' });
        }
        if (salarioInvalido(datos)) {
            return res.status(400).json({ success: false, mensaje: 'salary_min no puede ser mayor que salary_max' });
        }

        datos.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('jobs')
            .update(datos)
            .eq('id', id)
            .select(SELECT_OFERTA)
            .maybeSingle();

        if (error) return errorBD(res, error, 'Error al actualizar la oferta');
        if (!data) return res.status(404).json({ success: false, mensaje: 'Oferta no encontrada' });

        res.status(200).json({ success: true, mensaje: 'Oferta actualizada correctamente', oferta: data });
    } catch (error) {
        errorInterno(res, error);
    }
};

// DELETE /api/jobs/:id
const eliminarOferta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!esUuid(id)) {
            return res.status(400).json({ success: false, mensaje: 'El id no es un uuid válido' });
        }

        const { data, error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            // La oferta tiene postulaciones (tabla applications) que dependen de ella
            if (error.code === '23503') {
                return res.status(409).json({ success: false, mensaje: 'No se puede eliminar: la oferta tiene postulaciones' });
            }
            return errorBD(res, error, 'Error al eliminar la oferta');
        }
        if (!data) return res.status(404).json({ success: false, mensaje: 'Oferta no encontrada' });

        res.status(200).json({ success: true, mensaje: 'Oferta eliminada correctamente', oferta: data });
    } catch (error) {
        errorInterno(res, error);
    }
};

module.exports = {
    obtenerOfertas,
    obtenerOfertaPorId,
    crearOferta,
    actualizarOferta,
    eliminarOferta
};