const supabase = require('../config/supabase');

const obtenerOfertas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*');

        if (error) {
            return res.status(500).json({
                success: false,
                mensaje: 'Error al consultar ofertas',
                error: error.message
            });
        }

        res.status(200).json({
            success: true,
            total: data.length,
            ofertas: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
};

module.exports = {
    obtenerOfertas
};