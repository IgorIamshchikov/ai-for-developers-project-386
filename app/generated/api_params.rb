# GENERATED FILE — DO NOT EDIT BY HAND.
# Source: contract/openapi.yaml (compiled from contract/main.tsp).
# Regenerate: ./script/generate

module ApiParams
  module BookingCreate
    PERMITTED = %i[eventTypeId startsAt visitorName visitorEmail].freeze
    KEY_MAP = {
      "eventTypeId" => :event_type_id,
      "startsAt" => :starts_at,
      "visitorName" => :visitor_name,
      "visitorEmail" => :visitor_email
    }.freeze
  end

  module EventTypeCreate
    PERMITTED = %i[title description durationMinutes].freeze
    KEY_MAP = {
      "durationMinutes" => :duration_minutes
    }.freeze
  end
end
