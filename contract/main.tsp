import "@typespec/http";
import "@typespec/openapi3";

using Http;

/**
 * Контракт сервиса записи на звонки.
 *
 * Источник решений: карта «Спецификация бронирования» (issue #18),
 * тикеты «Сущности контракта» (#19), «Модель слотов и правила занятости» (#20)
 * и «Форма API и админская часть» (#21).
 */
@service(#{ title: "Календарь звонков" })
namespace CalendarBooking;

/** Единая форма ошибки: `{ error: { code, message } }`. */
@error
model ApiError {
  error: {
    code: string;
    message: string;
  };
}

/** Слот занят — гонка двух бронирований на одно время. */
@error
model SlotTakenError {
  @statusCode statusCode: 409;
  error: {
    code: "slot_taken";
    message: string;
  };
}

/** Невалидный запрос: пустые поля, некорректный email, `startsAt` не на границе сетки/в прошлом/вне окна. */
@error
model ValidationError {
  @statusCode statusCode: 422;
  error: {
    code: "validation";
    message: string;
  };
}

/** Неизвестный `eventTypeId`. */
@error
model NotFoundError {
  @statusCode statusCode: 404;
  error: {
    code: "not_found";
    message: string;
  };
}

/** Тип события: категория звонка в календаре владельца. */
model EventType {
  @format("uuid")
  id: string;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  @minValue(1)
  durationMinutes: int32;
}

/** Данные для создания типа события — владелец не передаёт `id`. */
model EventTypeCreate {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  @minValue(1)
  durationMinutes: int32;
}

/**
 * Свободный интервал сетки — вычисляемое представление, не сущность:
 * без `id`, конец выводится из длительности выбранного типа события.
 */
model Slot {
  startsAt: utcDateTime;
  endsAt: utcDateTime;
}

/** Бронирование: занятие посетителем свободного слота. */
model Booking {
  @format("uuid")
  id: string;

  @format("uuid")
  eventTypeId: string;

  startsAt: utcDateTime;

  @minLength(1)
  visitorName: string;

  @format("email")
  visitorEmail: string;
}

/** Данные для создания бронирования — посетитель не передаёт `id`. */
model BookingCreate {
  @format("uuid")
  eventTypeId: string;

  startsAt: utcDateTime;

  @minLength(1)
  visitorName: string;

  @format("email")
  visitorEmail: string;
}

@route("/api")
interface CalendarApi {
  /** Список типов событий по алфавиту `title` (гость и владелец). */
  @get
  @route("/event-types")
  listEventTypes(): EventType[];

  /** Создание типа события владельцем. */
  @post
  @route("/event-types")
  createEventType(@body body: EventTypeCreate): {
    @statusCode statusCode: 201;
    @body eventType: EventType;
  } | ValidationError;

  /** Свободные слоты типа события в окне 14 дней, по возрастанию `startsAt`. */
  @get
  @route("/event-types/{id}/slots")
  listSlots(@path id: string): Slot[] | NotFoundError;

  /** Создание бронирования гостем; гонка на один слот — 409. */
  @post
  @route("/bookings")
  createBooking(@body body: BookingCreate): {
    @statusCode statusCode: 201;
    @body booking: Booking;
  } | SlotTakenError | ValidationError | NotFoundError;

  /** Предстоящие встречи владельца, одним списком по возрастанию `startsAt`. */
  @get
  @route("/bookings")
  listBookings(): Booking[];
}
