
// src/features/login/hooks/useAuth.jsx

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";

/**
 * Subproceso de gestión de acceso — mock de backend en localStorage.
 *
 * IMPORTANTE PARA EL EQUIPO:
 * Todo esto simula el API real mientras no exista backend.
 *
 * El día que el backend esté listo, solo hay que reemplazar el
 * cuerpo de cada función (login, register, requestPasswordReset,
 * changePassword) por el fetch/axios correspondiente.
 *
 * La forma en que las páginas llaman a useAuth() no cambia.
 *
 * Datos gestionados:
 * - correo
 * - contraseña
 * - rol
 * - dirección
 *
 * Roles:
 * - cliente
 * - administrador
 * - repartidor
 *
 * Reglas:
 * - Validación de credenciales
 * - Bloqueo temporal tras múltiples intentos fallidos
 * - Registro de accesos
 * - Persistencia de usuarios en localStorage
 */

const USERS_KEY = "cb_users";
const SESSION_KEY = "cb_session";
const ACCESS_LOG_KEY = "cb_access_log";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

const AuthContext = createContext(null);

// -----------------------------------------------------------------------------
// USUARIOS DEMO
// -----------------------------------------------------------------------------

const SEED_USERS = [
  {
    id: "u-cliente-demo",
    fullName: "Isabella López",
    email: "cliente@chocoberry.com",
    password: "Cliente123!",
    role: "cliente",
    address: "Calle 13 #45-67, Barrio Centro",
    phone: "312 345 6789",
  },
  {
    id: "u-admin-demo",
    fullName: "Admin Chocoberry",
    email: "admin@chocoberry.com",
    password: "Admin123!",
    role: "administrador",
    address: "",
  },
  {
    id: "u-repartidor-demo",
    fullName: "Carlos Ruiz",
    email: "repartidor@chocoberry.com",
    password: "Repartidor123!",
    role: "repartidor",
    address: "",
  },
  {
    id: "u-cliente-01",
    fullName: "María Fernanda González",
    email: "maria.gonzalez@gmail.com",
    password: "Cliente01!",
    role: "cliente",
    address: "Carrera 43A #1-50, El Poblado",
    phone: "300 111 2233",
  },
  {
    id: "u-cliente-02",
    fullName: "Juan Pablo Rodríguez",
    email: "juan.rodriguez@hotmail.com",
    password: "Cliente02!",
    role: "cliente",
    address: "Calle 10 #43-21, El Poblado",
    phone: "301 222 3344",
  },
  {
    id: "u-cliente-03",
    fullName: "Ana Sofía Martínez",
    email: "ana.martinez@gmail.com",
    password: "Cliente03!",
    role: "cliente",
    address: "Carrera 70 #32-50, Laureles",
    phone: "302 333 4455",
  },
  {
    id: "u-cliente-04",
    fullName: "Carlos Andrés Hernández",
    email: "carlos.hernandez@outlook.com",
    password: "Cliente04!",
    role: "cliente",
    address: "Calle 50 #41-20, Belén",
    phone: "303 444 5566",
  },
  {
    id: "u-cliente-05",
    fullName: "Valentina López",
    email: "valentina.lopez@gmail.com",
    password: "Cliente05!",
    role: "cliente",
    address: "Carrera 65 #24-35, Estadio",
    phone: "304 555 6677",
  },
  {
    id: "u-cliente-06",
    fullName: "Santiago Ramírez",
    email: "santiago.ramirez@hotmail.com",
    password: "Cliente06!",
    role: "cliente",
    address: "Carrera 80 #30-20, Robledo",
    phone: "305 666 7788",
  },
  {
    id: "u-cliente-07",
    fullName: "Camila Torres",
    email: "camila.torres@gmail.com",
    password: "Cliente07!",
    role: "cliente",
    address: "Calle 33 #82-20, Belén",
    phone: "306 777 8899",
  },
  {
    id: "u-cliente-08",
    fullName: "Daniel Vargas",
    email: "daniel.vargas@outlook.com",
    password: "Cliente08!",
    role: "cliente",
    address: "Carrera 50 #12-40, Guayabal",
    phone: "307 888 9900",
  },
  {
    id: "u-cliente-09",
    fullName: "Isabella Morales",
    email: "isabella.morales@gmail.com",
    password: "Cliente09!",
    role: "cliente",
    address: "Avenida Guayabal #15-30, Guayabal",
    phone: "308 999 0011",
  },
  {
    id: "u-cliente-10",
    fullName: "Felipe Castro",
    email: "felipe.castro@hotmail.com",
    password: "Cliente10!",
    role: "cliente",
    address: "Carrera 42 #3-18, El Poblado",
    phone: "309 000 1122",
  },
  {
    id: "u-cliente-11",
    fullName: "Luciana Silva",
    email: "luciana.silva@gmail.com",
    password: "Cliente11!",
    role: "cliente",
    address: "Calle 8 #43-10, El Poblado",
    phone: "310 111 2233",
  },
  {
    id: "u-cliente-12",
    fullName: "Andrés Felipe Gómez",
    email: "andres.gomez@outlook.com",
    password: "Cliente12!",
    role: "cliente",
    address: "Carrera 70 #38-42, Laureles",
    phone: "311 222 3344",
  },
  {
    id: "u-cliente-13",
    fullName: "Daniela Ortiz",
    email: "daniela.ortiz@gmail.com",
    password: "Cliente13!",
    role: "cliente",
    address: "Calle 51 #42-15, Belén",
    phone: "312 333 4455",
  },
  {
    id: "u-cliente-14",
    fullName: "Sebastián Mendoza",
    email: "sebastian.mendoza@hotmail.com",
    password: "Cliente14!",
    role: "cliente",
    address: "Carrera 66 #32-28, Estadio",
    phone: "313 444 5566",
  },
  {
    id: "u-cliente-15",
    fullName: "Gabriela Peña",
    email: "gabriela.pena@gmail.com",
    password: "Cliente15!",
    role: "cliente",
    address: "Carrera 80 #25-10, Robledo",
    phone: "314 555 6677",
  },
  {
    id: "u-cliente-16",
    fullName: "Nicolás Ríos",
    email: "nicolas.rios@outlook.com",
    password: "Cliente16!",
    role: "cliente",
    address: "Calle 12 #43-30, El Poblado",
    phone: "315 666 7788",
  },
  {
    id: "u-cliente-17",
    fullName: "Paula Andrea Jiménez",
    email: "paula.jimenez@gmail.com",
    password: "Cliente17!",
    role: "cliente",
    address: "Carrera 48 #20-15, Guayabal",
    phone: "316 777 8899",
  },
  {
    id: "u-cliente-18",
    fullName: "Miguel Ángel Suárez",
    email: "miguel.suarez@hotmail.com",
    password: "Cliente18!",
    role: "cliente",
    address: "Calle 30A #82-40, Belén",
    phone: "317 888 9900",
  },
  {
    id: "u-cliente-19",
    fullName: "Carolina Duarte",
    email: "carolina.duarte@gmail.com",
    password: "Cliente19!",
    role: "cliente",
    address: "Carrera 43A #5-25, El Poblado",
    phone: "318 999 0011",
  },
  {
    id: "u-cliente-20",
    fullName: "Jorge Luis Parra",
    email: "jorge.parra@outlook.com",
    password: "Cliente20!",
    role: "cliente",
    address: "Avenida Las Vegas #56-20, Guayabal",
    phone: "319 000 1122",
  },
];

// -----------------------------------------------------------------------------
// STORE DE USUARIOS
// -----------------------------------------------------------------------------

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);

    let existing = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          existing = parsed;
        }
      } catch {
        // Si hay JSON inválido, ignorar y usar solo seeds
      }
    }

    // Crear mapa de usuarios existentes por email
    const existingByEmail = new Map(
      existing.map((u) => [u.email.toLowerCase(), u])
    );

    // Fusionar: sobrescribir o agregar seed users con datos actualizados
    let hasChanges = false;
    for (const seed of SEED_USERS) {
      const key = seed.email.toLowerCase();
      if (existingByEmail.has(key)) {
        // Actualizar campos del seed user existente
        const prev = existingByEmail.get(key);
        const updated = { ...seed, id: prev.id };
        if (JSON.stringify(prev) !== JSON.stringify(updated)) {
          existingByEmail.set(key, updated);
          hasChanges = true;
        }
      } else {
        // Agregar nuevo seed user
        existingByEmail.set(key, seed);
        hasChanges = true;
      }
    }

    const merged = Array.from(existingByEmail.values());

    // Si hubo cambios, escribir de vuelta
    if (hasChanges) {
      localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    }

    return merged;
  } catch {
    return SEED_USERS;
  }
}

function writeUsers(users) {
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );
}

/**
 * API pública del store de usuarios.
 *
 * Estas dos funciones son utilizadas por:
 *
 * src/features/admin/users/hooks/useUsersAdmin.js
 *
 * para leer y modificar la MISMA lista de usuarios
 * utilizada por el login.
 */

export function getUsersStore() {
  return readUsers();
}

export function setUsersStore(users) {
  writeUsers(users);
}

// -----------------------------------------------------------------------------
// SESIÓN
// -----------------------------------------------------------------------------

function readSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ||
      sessionStorage.getItem(SESSION_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// LOG DE ACCESOS
// -----------------------------------------------------------------------------

function logAccess(entry) {
  try {
    const raw = localStorage.getItem(ACCESS_LOG_KEY);

    const log = raw
      ? JSON.parse(raw)
      : [];

    log.unshift({
      ...entry,
      date: new Date().toISOString(),
    });

    localStorage.setItem(
      ACCESS_LOG_KEY,
      JSON.stringify(log.slice(0, 50))
    );
  } catch {
    // Auditoría best-effort:
    // si falla, no debe romper el login.
  }
}

// -----------------------------------------------------------------------------
// INTENTOS FALLIDOS
// -----------------------------------------------------------------------------

function getAttempts(email) {
  try {
    const raw = localStorage.getItem(
      `cb_attempts_${email.toLowerCase()}`
    );

    return raw
      ? JSON.parse(raw)
      : {
          count: 0,
          lockUntil: 0,
        };
  } catch {
    return {
      count: 0,
      lockUntil: 0,
    };
  }
}

function setAttempts(email, data) {
  localStorage.setItem(
    `cb_attempts_${email.toLowerCase()}`,
    JSON.stringify(data)
  );
}

function clearAttempts(email) {
  localStorage.removeItem(
    `cb_attempts_${email.toLowerCase()}`
  );
}

// -----------------------------------------------------------------------------
// DELAY — SIMULACIÓN DE API
// -----------------------------------------------------------------------------

function delay(ms = 700) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

// -----------------------------------------------------------------------------
// AUTH PROVIDER
// -----------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    readSession()
  );

  // ---------------------------------------------------------------------------
  // STORAGE EVENT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function onStorage(event) {
      // Cambio de sesión
      if (event.key === SESSION_KEY) {
        setUser(readSession());
      }

      // Cambio de usuarios desde otra pestaña
      if (event.key === USERS_KEY) {
        // Si el usuario actual fue eliminado o deshabilitado,
        // comprobamos nuevamente su estado.
        const currentSession = readSession();

        if (!currentSession) {
          setUser(null);
          return;
        }

        const users = readUsers();

        const currentUser = users.find(
          (u) => u.id === currentSession.id
        );

        if (!currentUser || currentUser.active === false) {
          setUser(null);

          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    }

    window.addEventListener(
      "storage",
      onStorage
    );

    return () =>
      window.removeEventListener(
        "storage",
        onStorage
      );
  }, []);

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async ({ email, password, remember }) => {
      await delay();

      const normalizedEmail =
        email.trim().toLowerCase();

      // Revisar bloqueo
      const {
        count,
        lockUntil,
      } = getAttempts(normalizedEmail);

      if (
        lockUntil &&
        Date.now() < lockUntil
      ) {
        const secondsLeft = Math.ceil(
          (lockUntil - Date.now()) / 1000
        );

        const err = new Error(
          `Demasiados intentos fallidos. Intenta de nuevo en ${secondsLeft}s.`
        );

        err.code = "LOCKED";
        err.secondsLeft = secondsLeft;

        throw err;
      }

      // Leer usuarios
      const users = readUsers();

      const found = users.find(
        (u) =>
          u.email.toLowerCase() ===
          normalizedEmail
      );

      // Usuario inexistente o contraseña incorrecta
      if (
        !found ||
        found.password !== password
      ) {
        const nextCount = count + 1;

        const shouldLock =
          nextCount >= MAX_ATTEMPTS;

        setAttempts(
          normalizedEmail,
          {
            count: shouldLock
              ? 0
              : nextCount,

            lockUntil: shouldLock
              ? Date.now() + LOCK_MS
              : 0,
          }
        );

        logAccess({
          email: normalizedEmail,
          result: "fallido",
        });

        if (shouldLock) {
          const err = new Error(
            `Superaste el número de intentos permitidos. Cuenta bloqueada temporalmente por ${
              LOCK_MS / 1000
            }s.`
          );

          err.code = "LOCKED";
          err.secondsLeft =
            LOCK_MS / 1000;

          throw err;
        }

        const err = new Error(
          "Correo o contraseña incorrectos."
        );

        err.code =
          "INVALID_CREDENTIALS";

        err.attemptsLeft =
          MAX_ATTEMPTS - nextCount;

        throw err;
      }

      // -----------------------------------------------------------------------
      // USUARIO DESHABILITADO
      // -----------------------------------------------------------------------

      if (found.active === false) {
        logAccess({
          email: normalizedEmail,
          result: "usuario_deshabilitado",
        });

        const err = new Error(
          "Esta cuenta se encuentra deshabilitada. Contacta al administrador."
        );

        err.code = "USER_DISABLED";

        throw err;
      }

      // Login correcto
      clearAttempts(normalizedEmail);

      logAccess({
        email: normalizedEmail,
        result: "exitoso",
      });

      // Nunca guardamos la contraseña dentro de la sesión
      const sessionUser = {
        id: found.id,
        fullName: found.fullName,
        email: found.email,
        role: found.role,
      };

      setUser(sessionUser);

      const storage = remember
        ? localStorage
        : sessionStorage;

      storage.setItem(
        SESSION_KEY,
        JSON.stringify(sessionUser)
      );

      // Evitar sesión duplicada
      (
        remember
          ? sessionStorage
          : localStorage
      ).removeItem(SESSION_KEY);

      return sessionUser;
    },
    []
  );

  // ---------------------------------------------------------------------------
  // REGISTRO
  // ---------------------------------------------------------------------------

  const register = useCallback(
    async ({
      fullName,
      email,
      password,
      address,
    }) => {
      await delay();

      const normalizedEmail =
        email.trim().toLowerCase();

      const users = readUsers();

      // Validar correo existente
      if (
        users.some(
          (u) =>
            u.email.toLowerCase() ===
            normalizedEmail
        )
      ) {
        const err = new Error(
          "Ya existe una cuenta registrada con ese correo."
        );

        err.code = "EMAIL_TAKEN";

        throw err;
      }

      const newUser = {
        id: `u-${Date.now()}`,
        fullName: fullName.trim(),
        email: normalizedEmail,
        password,
        role: "cliente",
        address:
          address?.trim() || "",
        active: true,
        createdAt:
          new Date().toISOString(),
      };

      writeUsers([
        ...users,
        newUser,
      ]);

      logAccess({
        email: normalizedEmail,
        result: "registro",
      });

      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };
    },
    []
  );

  // ---------------------------------------------------------------------------
  // RECUPERACIÓN DE CONTRASEÑA
  // ---------------------------------------------------------------------------

  const requestPasswordReset =
    useCallback(
      async (email) => {
        await delay();

        const normalizedEmail =
          email.trim().toLowerCase();

        const users = readUsers();

        const exists = users.some(
          (u) =>
            u.email.toLowerCase() ===
            normalizedEmail
        );

        /*
         * Por seguridad nunca revelamos si el correo existe.
         */

        if (exists) {
          const token =
            Math.random()
              .toString(36)
              .slice(2, 10);

          localStorage.setItem(
            `cb_reset_${normalizedEmail}`,
            JSON.stringify({
              token,
              expires:
                Date.now() +
                15 * 60_000,
            })
          );

          // eslint-disable-next-line no-console
          console.info(
            `[DEMO] Enlace de recuperación para ${normalizedEmail}: /restablecer-contrasena?email=${encodeURIComponent(
              normalizedEmail
            )}&token=${token}`
          );
        }

        return {
          ok: true,
        };
      },
      []
    );

  // ---------------------------------------------------------------------------
  // CAMBIAR CONTRASEÑA
  // ---------------------------------------------------------------------------

  const changePassword =
    useCallback(
      async ({
        currentPassword,
        newPassword,
      }) => {
        await delay();

        if (!user) {
          const err = new Error(
            "Debes iniciar sesión para cambiar tu contraseña."
          );

          err.code =
            "NOT_AUTHENTICATED";

          throw err;
        }

        const users = readUsers();

        const idx =
          users.findIndex(
            (u) => u.id === user.id
          );

        if (
          idx === -1 ||
          users[idx].password !==
            currentPassword
        ) {
          const err = new Error(
            "La contraseña actual no es correcta."
          );

          err.code =
            "INVALID_CURRENT_PASSWORD";

          throw err;
        }

        users[idx] = {
          ...users[idx],
          password: newPassword,
        };

        writeUsers(users);

        logAccess({
          email: user.email,
          result: "cambio_contrasena",
        });

        return {
          ok: true,
        };
      },
      [user]
    );

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------

  const logout = useCallback(
    () => {
      if (user) {
        logAccess({
          email: user.email,
          result: "cierre_sesion",
        });
      }

      setUser(null);

      localStorage.removeItem(
        SESSION_KEY
      );

      sessionStorage.removeItem(
        SESSION_KEY
      );
    },
    [user]
  );

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      user,

      isAuthenticated:
        !!user,

      role:
        user?.role ?? null,

      login,
      register,
      requestPasswordReset,
      changePassword,
      logout,
    }),
    [
      user,
      login,
      register,
      requestPasswordReset,
      changePassword,
      logout,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// USE AUTH
// -----------------------------------------------------------------------------

export function useAuth() {
  const ctx =
    useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth debe usarse dentro de <AuthProvider>"
    );
  }

  return ctx;
}

