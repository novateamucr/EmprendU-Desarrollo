import { Link } from "react-router-dom";
import { CardLanding } from "../components/CardLanding";
import logo from "../assets/logo.png";
import hero from "../assets/hero.png";
import vision from "../assets/vision_8440711.png";

export default function Landing() {
    return (
        <div className="bg-white text-gray-900">
            {/* Header / Hero Section */}
            <section className="max-w-7xl mx-auto md:px-12 py-16 grid md:grid-cols-2 items-center gap-12">
                <div>
                    <img src={logo} alt="EmprendU Logo" className="w-28 mb-6" />
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
                        Haz que tu idea llegue más lejos. Comparte, conecta y haz crecer tu
                        emprendimiento con EmprendU.
                    </h1>
                    <p className="text-gray-600 mb-6">
                        EmprendU es una plataforma para la comunidad donde podés registrar,
                        gestionar y dar visibilidad a los proyectos emprendedores.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/login">
                            <button className="px-6 py-3 border border-black rounded-full hover:bg-gray-100">
                                Registrarse gratis
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Imagen con íconos */}
                <div className="relative flex justify-center">
                    <img src={hero} alt="Hero" className="w-72 md:w-90 relative z-10" />
                    <img src={hero} alt="icono" className="absolute w-16 top-0 right-20" />
                    <img src={hero} alt="icono" className="absolute w-14 top-10 left-12" />
                    <img src={hero} alt="icono" className="absolute w-20 bottom-0 left-0" />
                    <img src={hero} alt="icono" className="absolute w-12 bottom-10 right-8" />
                </div>
            </section>

            {/* ¿Por qué usar EmprendU? */}
            <section className="py-16">
                <h2 className="text-2xl font-bold text-center mb-12">
                    ¿Por qué usar EmprendU?
                </h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
                    <CardLanding
                        title="Visibilidad"
                        imgUrl={vision}
                        description="Da a conocer tu emprendimiento y llega a más personas en tu comunidad y más allá."
                    />
                    <CardLanding
                        title="Conexión"
                        imgUrl="/icons/conexion.svg"
                        description="Conecta con clientes, colaboradores y aliados estratégicos para hacer crecer tu idea."
                    />
                    <CardLanding
                        title="Crecimiento"
                        imgUrl="/icons/crecimiento.svg"
                        description="Encuentra herramientas, oportunidades y apoyo para impulsar tu emprendimiento."
                    />
                </div>
            </section>

            {/* ¿Cómo funciona? */}
            <section className="py-16 bg-white">
                <h2 className="text-2xl font-bold text-center mb-10">¿Cómo funciona?</h2>
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 relative">
                        <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-emerald-200"></div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                                1
                            </div>
                            <h3 className="mt-4 font-semibold">Registra tu emprendimiento</h3>
                            <p className="text-gray-600 text-sm mt-2">
                                Crea una cuenta y promociona tu idea fácilmente.
                            </p>
                        </div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                                2
                            </div>
                            <h3 className="mt-4 font-semibold">Gestiona tu información</h3>
                            <p className="text-gray-600 text-sm mt-2">
                                Organiza tus productos y datos en un panel simple.
                            </p>
                        </div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                                3
                            </div>
                            <h3 className="mt-4 font-semibold">Conecta con la comunidad</h3>
                            <p className="text-gray-600 text-sm mt-2">
                                Encuentra oportunidades con la comunidad.
                            </p>
                        </div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                                4
                            </div>
                            <h3 className="mt-4 font-semibold">Haz crecer tu emprendimiento</h3>
                            <p className="text-gray-600 text-sm mt-2">
                                Accede a recursos y apoyo para seguir avanzando.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-center mt-10">
                        <Link
                            to="/"
                            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-600 transition"
                        >
                            Conocer más
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-6">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-6 md:px-12">
                    <p className="text-sm">© 2025 EmprendU. Todos los derechos reservados.</p>
                    <img src={hero} alt="Logo" className="w-8 bg-white p-1 rounded-full" />
                </div>
            </footer>
        </div>
    );
}
