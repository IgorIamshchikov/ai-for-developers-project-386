# Свободные Слоты сетки для Типа события (contract/main.tsp, issue #28):
# границы каждые 30 минут, окно 14 дней по UTC-суткам, с учётом занятости по
# реальным Бронированиям любого Типа события (пересечение интервалов).
class SlotCalculator
  def initialize(event_type, now: Time.current)
    @event_type = event_type
    @now = now
  end

  def call
    duration = @event_type.duration_minutes.minutes
    window_end = Booking.window_end(now: @now)
    bookings = overlapping_candidate_bookings(window_end)

    slots = []
    starts_at = first_grid_boundary_after(@now)
    while starts_at < window_end
      ends_at = starts_at + duration
      slots << { startsAt: starts_at, endsAt: ends_at } unless bookings.any? { |b_start, b_end| starts_at < b_end && b_start < ends_at }
      starts_at += Booking::GRID_STEP
    end
    slots
  end

  private

  def overlapping_candidate_bookings(window_end)
    Booking.where("starts_at < ? AND ends_at > ?", window_end, @now).pluck(:starts_at, :ends_at)
  end

  # Наименьшая граница сетки (:00/:30), строго позже `now`.
  def first_grid_boundary_after(now)
    utc = now.utc
    floor = utc.change(min: (utc.min / 30) * 30, sec: 0, usec: 0)
    floor + Booking::GRID_STEP
  end
end
